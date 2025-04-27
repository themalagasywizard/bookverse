// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

class BookPreview {
    constructor(container, pdfUrl) {
        this.container = container;
        this.pdfUrl = pdfUrl;
        this.currentPage = 1;
        this.pdf = null;
        this.pageCount = 0;
        this.scale = 1.0;
        this.trimSize = { width: 5.5, height: 8.5 }; // Default trim size in inches
        this.binding = 'Paperback';
        this.margins = { top: 0.75, bottom: 0.75, inner: 0.75, outer: 0.75 }; // in inches
        this.currentRenderTask = null;
        this.renderPending = false;
        this.debounceTimeout = null;
        
        this.init();
    }

    async init() {
        try {
            // Create preview container
            this.previewContainer = document.createElement('div');
            this.previewContainer.className = 'book-preview-container';
            this.previewContainer.innerHTML = `
                <div class="page-container relative bg-white rounded-lg shadow-lg">
                    <canvas id="pageCanvas" class="w-full h-full"></canvas>
                    <div class="margin-overlay absolute inset-0 pointer-events-none border-2 border-dashed border-red-300 opacity-50"></div>
                </div>
                <div class="preview-controls mt-4 flex items-center justify-between">
                    <button id="prevPage" class="preview-btn flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                        Previous
                    </button>
                    <span id="pageInfo" class="text-sm text-gray-600">Page 1 of 1</span>
                    <button id="nextPage" class="preview-btn flex items-center">
                        Next
                        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            `;
            this.container.appendChild(this.previewContainer);

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .book-preview-container {
                    width: 100%;
                    height: 100%;
                }
                .page-container {
                    width: 100%;
                    aspect-ratio: ${this.trimSize.width / this.trimSize.height};
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: white;
                }
                .preview-btn {
                    padding: 8px 16px;
                    background: #FF5733;
                    color: white;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                }
                .preview-btn:hover {
                    background: #E04C2D;
                }
                .preview-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                .margin-overlay {
                    transition: all 0.3s ease;
                }
            `;
            document.head.appendChild(style);

            // Load PDF
            await this.loadPdf();
            
            // Set up event listeners
            document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
            document.getElementById('nextPage').addEventListener('click', () => this.nextPage());
            
            // Initial render
            this.renderCurrentPage();

            // Update resize observer to use debounced render
            const resizeObserver = new ResizeObserver(() => {
                this.renderCurrentPage();
            });
            resizeObserver.observe(this.container);

            // Clean up on destroy
            this.destroy = () => {
                if (this.currentRenderTask) {
                    this.currentRenderTask.cancel();
                }
                if (this.debounceTimeout) {
                    clearTimeout(this.debounceTimeout);
                }
                resizeObserver.disconnect();
            };

        } catch (error) {
            console.error('Error initializing book preview:', error);
            this.showError('Failed to initialize book preview. Please try again.');
        }
    }

    async loadPdf() {
        try {
            this.pdf = await pdfjsLib.getDocument(this.pdfUrl).promise;
            this.pageCount = this.pdf.numPages;
            this.updateControls();
            document.getElementById('pageInfo').textContent = `Page ${this.currentPage} of ${this.pageCount}`;
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw error;
        }
    }

    async renderCurrentPage() {
        // Clear any pending render timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        // Debounce the render operation
        this.debounceTimeout = setTimeout(async () => {
            try {
                // Cancel any ongoing render task
                if (this.currentRenderTask) {
                    await this.currentRenderTask.cancel();
                    this.currentRenderTask = null;
                }

                const page = await this.pdf.getPage(this.currentPage);
                const canvas = document.getElementById('pageCanvas');
                const container = canvas.parentElement;
                
                // Calculate scale to fit container
                const containerWidth = container.clientWidth - 40;
                const containerHeight = container.clientHeight - 40;
                const pageAspect = page.view[2] / page.view[3];
                const containerAspect = containerWidth / containerHeight;
                
                let scale;
                if (pageAspect > containerAspect) {
                    scale = containerWidth / page.view[2];
                } else {
                    scale = containerHeight / page.view[3];
                }

                const viewport = page.getViewport({ scale });
                
                // Set canvas size
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // Create and store the render task
                const context = canvas.getContext('2d');
                this.currentRenderTask = page.render({
                    canvasContext: context,
                    viewport: viewport
                });

                // Wait for render to complete
                await this.currentRenderTask.promise;
                this.currentRenderTask = null;

                // Update margin overlay
                const marginOverlay = container.querySelector('.margin-overlay');
                const marginTop = (this.margins.top * scale * 72);
                const marginBottom = (this.margins.bottom * scale * 72);
                const marginLeft = (this.margins.outer * scale * 72);
                const marginRight = (this.margins.inner * scale * 72);
                
                marginOverlay.style.top = `${marginTop}px`;
                marginOverlay.style.bottom = `${marginBottom}px`;
                marginOverlay.style.left = `${marginLeft}px`;
                marginOverlay.style.right = `${marginRight}px`;

            } catch (error) {
                // Only show error if it's not a cancellation
                if (error.message !== 'Rendering cancelled, page 1') {
                    console.error('Error rendering page:', error);
                    this.showError('Failed to render page. Please try again.');
                }
            }
        }, 100); // 100ms debounce delay
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderCurrentPage();
            this.updateControls();
        }
    }

    nextPage() {
        if (this.currentPage < this.pageCount) {
            this.currentPage++;
            this.renderCurrentPage();
            this.updateControls();
        }
    }

    updateControls() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');
        
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === this.pageCount;
        pageInfo.textContent = `Page ${this.currentPage} of ${this.pageCount}`;
    }

    setTrimSize(width, height) {
        this.trimSize = { width, height };
        const container = document.querySelector('.page-container');
        container.style.aspectRatio = `${width}/${height}`;
        this.renderCurrentPage();
    }

    setBinding(binding) {
        this.binding = binding;
        this.renderCurrentPage();
    }

    setMargins(margins) {
        this.margins = margins;
        this.renderCurrentPage();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'preview-error';
        errorDiv.style.cssText = `
            color: red;
            text-align: center;
            padding: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin: 10px 0;
        `;
        errorDiv.textContent = message;
        this.container.appendChild(errorDiv);
    }

    // Add cleanup method
    destroy() {
        if (this.currentRenderTask) {
            this.currentRenderTask.cancel();
        }
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
    }

    // Update navigation methods to handle rendering properly
    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.renderCurrentPage();
            this.updateControls();
        }
    }

    async nextPage() {
        if (this.currentPage < this.pageCount) {
            this.currentPage++;
            await this.renderCurrentPage();
            this.updateControls();
        }
    }

    // Update setting methods to handle rendering properly
    async setTrimSize(width, height) {
        this.trimSize = { width, height };
        const container = document.querySelector('.page-container');
        container.style.aspectRatio = `${width}/${height}`;
        await this.renderCurrentPage();
    }

    async setBinding(binding) {
        this.binding = binding;
        await this.renderCurrentPage();
    }

    async setMargins(margins) {
        this.margins = margins;
        await this.renderCurrentPage();
    }
}

// Export the class
window.BookPreview = BookPreview; 