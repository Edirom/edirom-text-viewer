const templates = {
    desktop: `
<div>
    <style>
        :host {
            display: block;
            height: 100%;
            width: 100%;
            overflow-y: auto;
            overflow-x: hidden;
        }
        #text-view-container {
            padding: 16px;
            line-height: 1.6;
        }
        #text-view-container p {
            margin: 0 0 1em 0;
        }
        #text-view-container h1,
        #text-view-container h2,
        #text-view-container h3 {
            margin: 1em 0 0.5em 0;
            font-weight: 600;
        }
    </style>
    <div id="text-view-container"></div>
</div>
`,

    mobile: `
<div>
    <style>
        :host {
            display: block;
            height: 100%;
            width: 100%;
            max-width: 100%;
            max-height: 100%;
            overflow-y: auto;
            overflow-x: auto;
        }
        #text-view-container {
            padding: 12px 16px;
            font-size: 1rem;
            line-height: 1.6;
            color: #333;
        }
        #text-view-container p {
            margin: 0 0 1em 0;
        }
        #text-view-container h1,
        #text-view-container h2,
        #text-view-container h3 {
            margin: 1em 0 0.5em 0;
            font-weight: 600;
        }
        #text-view-container h1 { font-size: 1.3rem; }
        #text-view-container h2 { font-size: 1.15rem; }
        #text-view-container h3 { font-size: 1.05rem; }
        #text-view-container a {
            color: #0066cc;
        }

        #text-view-container img {
            max-width: 100%;
            height: auto;
        }
    </style>
    <div id="text-view-container"></div>
</div>
`
};


class textViewerElement extends HTMLElement {
    // Private backing fields
    #htmlData = '';
    #scrollToId = null;

    constructor() {
        super();
        this.mode = this.getLayoutMode(this.getAttribute('layout-mode'));
        this.shadow = this.attachShadow({ mode: "open" });
    }

    static get observedAttributes() {
        return ['layout-mode', 'html-data', 'scroll-to-id'];
    }

    // Gets executed when the element is added to the DOM
    connectedCallback() {
        console.log("Text Viewer connected to DOM.");
        this.mode = this.getLayoutMode(this.getAttribute('layout-mode'));
        this.applyTemplate();
        this.renderText();
    }

    disconnectedCallback() {
        console.log("Text Viewer disconnected from DOM.");
    }

    // Executed when an observed attribute changes
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        console.log(`Text Viewer attribute changed: ${name} from ${oldValue} to ${newValue}`);
        if (name === 'layout-mode') {
            this.mode = this.getLayoutMode(newValue);
            this.applyTemplate();
            this.renderText();
        } else if (name === 'html-data') {
            this.#htmlData = newValue ?? '';
            if (this.isConnected) {
                this.renderText();
            }
        } else if (name === 'scroll-to-id') {
            // Store the target ID; scrolling is driven by renderText() when html-data is set
            this.#scrollToId = newValue || null;
            requestAnimationFrame(() => this.scrollToId(this.#scrollToId));
        }
    }

    getLayoutMode = (layoutMode) => layoutMode === 'mobile' ? 'mobile' : 'desktop';

    applyTemplate = () => {
        const template = document.createElement("template");
        template.innerHTML = templates[this.mode];
        this.shadow.innerHTML = '';
        this.shadow.append(template.content.cloneNode(true));
    }

    renderText = () => {
        const container = this.shadow.getElementById("text-view-container");
        if (!container) return;
        container.innerHTML = this.#htmlData;
        this.interceptLoadLinks(container);
        if (this.#scrollToId) {
            requestAnimationFrame(() => this.scrollToId(this.#scrollToId));
        }
    }

    // Finds all elements with onclick="loadLink(...)" in the rendered HTML,
    // strips the onclick attribute, and replaces it with a load-link CustomEvent.
    // The URI and optional config block are forwarded as a plist string in event.detail.plist.
    // The {…} config object from the original onclick is transformed syntactically to the
    // [key:value] bracket format understood by parseTargets() in linkController — no semantic
    // interpretation happens here; the hosting app decides what to do with the config.
    interceptLoadLinks = (container) => {
        const LOADLINK_RE = /loadLink\(\s*["']([^"']+)["']\s*(?:,\s*(\{[^}]*\}))?\s*\)/;
        container.querySelectorAll('[onclick]').forEach(el => {
            const onclick = el.getAttribute('onclick');
            const match = onclick?.match(LOADLINK_RE);
            if (!match) return;

            const uri = match[1];
            const rawConfig = match[2]; // e.g. "{useExisting:true}" or undefined

            // Transform {key:value,...} → [key:value,...] so parseTargets can consume it.
            const plist = rawConfig
                ? uri + '[' + rawConfig.slice(1, -1) + ']'
                : uri;

            el.removeAttribute('onclick');
            el.addEventListener('click', (e) => {
                e.preventDefault();
                this.dispatchEvent(new CustomEvent('load-link', {
                    bubbles: true,
                    composed: true,
                    detail: { plist }
                }));
            });
        });
    }

    scrollToId = (id) => {
        if (!id) return;
        const el = this.shadow.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

}

customElements.define("edirom-text-viewer", textViewerElement);
