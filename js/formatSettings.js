class FormatSettings {
    constructor(container, onChange) {
        this.container = container;
        this.onChange = onChange;
        this.trimSizes = [
            { name: '5.5 x 8.5', width: 5.5, height: 8.5 },
            { name: '6 x 9', width: 6, height: 9 },
            { name: '8.5 x 11', width: 8.5, height: 11 }
        ];
        this.bindings = [
            { name: 'Hardcover', gutter: 0.5, spine_factor: 0.0033 },
            { name: 'Paperback', gutter: 0.3, spine_factor: 0.0025 }
        ];
        this.margins = { top: 0.75, bottom: 0.75, inner: 0.75, outer: 0.75 };
        
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="space-y-6">
                <!-- Trim Size -->
                <div class="format-option">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Trim Size</label>
                    <div class="relative">
                        <select id="trimSize" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent bg-white appearance-none">
                            ${this.trimSizes.map(size => 
                                `<option value="${size.name}">${size.name} inches</option>`
                            ).join('')}
                        </select>
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                            </svg>
                        </div>
                        <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Binding -->
                <div class="format-option">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Binding Type</label>
                    <div class="grid grid-cols-2 gap-3">
                        ${this.bindings.map(binding => `
                            <label class="relative flex cursor-pointer">
                                <input type="radio" name="binding" value="${binding.name}"
                                       class="sr-only peer" ${binding.name === 'Paperback' ? 'checked' : ''}>
                                <div class="w-full bg-white border rounded-lg px-4 py-3 peer-checked:border-[#FF5733] peer-checked:text-[#FF5733] transition-colors">
                                    <div class="flex items-center justify-center">
                                        <svg class="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                                                  d="${binding.name === 'Hardcover' 
                                                    ? 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                                                    : 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'}"/>
                                        </svg>
                                        ${binding.name}
                                    </div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Margins -->
                <div class="format-option">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Margins</label>
                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <label class="text-xs text-gray-500">Top & Bottom</label>
                                <span class="text-xs font-medium" id="verticalMarginValue">0.75 inches</span>
                            </div>
                            <input type="range" id="verticalMargin"
                                   min="0.5" max="2" step="0.25" value="0.75"
                                   class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                        </div>
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <label class="text-xs text-gray-500">Inner & Outer</label>
                                <span class="text-xs font-medium" id="horizontalMarginValue">0.75 inches</span>
                            </div>
                            <input type="range" id="horizontalMargin"
                                   min="0.5" max="2" step="0.25" value="0.75"
                                   class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        this.container.querySelector('#trimSize').addEventListener('change', (e) => {
            const size = this.trimSizes.find(s => s.name === e.target.value);
            this.onChange('trimSize', size);
        });

        this.container.querySelectorAll('input[name="binding"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const binding = this.bindings.find(b => b.name === e.target.value);
                this.onChange('binding', binding);
            });
        });

        this.container.querySelector('#verticalMargin').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.container.querySelector('#verticalMarginValue').textContent = `${value} inches`;
            this.margins.top = value;
            this.margins.bottom = value;
            this.onChange('margins', this.margins);
            this.validateMargins();
        });

        this.container.querySelector('#horizontalMargin').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.container.querySelector('#horizontalMarginValue').textContent = `${value} inches`;
            this.margins.inner = value;
            this.margins.outer = value;
            this.onChange('margins', this.margins);
            this.validateMargins();
        });
    }

    validateMargins() {
        const marginWarning = document.getElementById('margin-warning');
        if (this.margins.top < 0.75 || this.margins.bottom < 0.75 || 
            this.margins.inner < 0.75 || this.margins.outer < 0.75) {
            marginWarning.classList.remove('hidden');
            return false;
        } else {
            marginWarning.classList.add('hidden');
            return true;
        }
    }

    validateSettings() {
        return this.validateMargins();
    }
}

// Export the class
window.FormatSettings = FormatSettings; 