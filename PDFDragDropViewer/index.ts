import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let pdfjsLib: any;

export class PDFDragDropViewer
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private container: HTMLDivElement;
  private notifyOutputChanged: () => void;

  private pdfFileInput: HTMLInputElement;
  private imageFileInput: HTMLInputElement;
  private pdfContainer: HTMLDivElement;
  private imageList: HTMLDivElement;
  private draggingImg: HTMLImageElement | null = null;
  private currentOverlay: HTMLDivElement | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private imagesOnPages: { [key: number]: any[] } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pdfDoc: any = null;
  private scale: number = 1.5;

  // Base64 của PDF mẫu
  private readonly defaultPdfBase64 =
    "JVBERi0xLjYNJeLjz9MNCjI0IDAgb2JqDTw8L0ZpbHRlci9GbGF0ZURlY29kZS9GaXJzdCA0L0xlbmd0aCAyMTYvTiAxL1R5cGUvT2JqU3RtPj5zdHJlYW0NCmjePI9RS8MwFIX/yn1bi9jepCQ6GYNpFBTEMsW97CVLbjWYNpImmz/fVsXXcw/f/c4SEFarepPTe4iFok8dU09DgtDBQx6TMwT74vaLTE7uSPDUdXM0Xe/73r1FnVwYYEtHR6d9WdY3kX4ipRMV6oojSmxQMoGyac5RLBAXf63p38aGA7XPorLewyvFcYaJile8rB+D/YcwiRdMMGScszO8/IW0MdhsaKKYGA46gXKTr/cUQVY4We/cYMNpnLVeXPJUXHs9fECr7kAFk+eZ5Xr9LcAAfKpQrA0KZW5kc3RyZWFtDWVuZG9iag0yNSAwIG9iag08PC9GaWx0ZXIvRmxhdGVEZWNvZGUvRmlyc3QgNC9MZW5ndGggNDkvTiAxL1R5cGUvT2JqU3RtPj5zdHJlYW0NCmjeslAwULCx0XfOL80rUTDU985MKY42NAIKBsXqh1QWpOoHJKanFtvZAQQYAN/6C60NCmVuZHN0cmVhbQ1lbmRvYmoNMjYgMCBvYmoNPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0ZpcnN0IDkvTGVuZ3RoIDQyL04gMi9UeXBlL09ialN0bT4+c3RyZWFtDQpo3jJTMFAwVzC0ULCx0fcrzS2OBnENFIJi7eyAIsH6LnZ2AAEGAI2FCDcNCmVuZHN0cmVhbQ1lbmRvYmoNMjcgMCBvYmoNPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0ZpcnN0IDUvTGVuZ3RoIDEyMC9OIDEvVHlwZS9PYmpTdG0+PnN0cmVhbQ0KaN4yNFIwULCx0XfOzytJzSspVjAyBgoE6TsX5Rc45VdEGwB5ZoZGCuaWRrH6vqkpmYkYogGJRUCdChZgfUGpxfmlRcmpxUAzA4ryk4NTS6L1A1zc9ENSK0pi7ez0g/JLEktSFQz0QyoLUoF601Pt7AACDADYoCeWDQplbmRzdHJlYW0NZW5kb2JqDTIgMCBvYmoNPDwvTGVuZ3RoIDM1MjUvU3VidHlwZS9YTUwvVHlwZS9NZXRhZGF0YT4+c3RyZWFtDQo8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjQtYzAwNSA3OC4xNDczMjYsIDIwMTIvMDgvMjMtMTM6MDM6MDMgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnBkZj0iaHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj4KICAgICAgICAgPHBkZjpQcm9kdWNlcj5BY3JvYmF0IERpc3RpbGxlciA2LjAgKFdpbmRvd3MpPC9wZGY6UHJvZHVjZXI+CiAgICAgICAgIDx4bXA6Q3JlYXRlRGF0ZT4yMDA2LTAzLTA2VDE1OjA2OjMzLTA1OjAwPC94bXA6Q3JlYXRlRGF0ZT4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZVBTNS5kbGwgVmVyc2lvbiA1LjIuMjwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxNi0wNy0xNVQxMDoxMjoyMSswODowMDwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTYtMDctMTVUMTA6MTI6MjErMDg6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPnV1aWQ6ZmYzZGNmZDEtMjNmYS00NzZmLTgzOWEtM2U1Y2FlMmRhMmViPC94bXBNTTpEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SW5zdGFuY2VJRD51dWlkOjM1OTM1MGIzLWFmNDAtNGQ4YS05ZDZjLTAzMTg2YjRmZmIzNjwveG1wTU06SW5zdGFuY2VJRD4KICAgICAgICAgPGRjOmZvcm1hdD5hcHBsaWNhdGlvbi9wZGY8L2RjOmZvcm1hdD4KICAgICAgICAgPGRjOnRpdGxlPgogICAgICAgICAgICA8cmRmOkFsdD4KICAgICAgICAgICAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5CbGFuayBQREYgRG9jdW1lbnQ8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6QWx0PgogICAgICAgICA8L2RjOnRpdGxlPgogICAgICAgICA8ZGM6Y3JlYXRvcj4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGk+RGVwYXJ0bWVudCBvZiBKdXN0aWNlIChFeGVjdXRpdmUgT2ZmaWNlIG9mIEltbWlncmF0aW9uIFJldmlldyk8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L2RjOmNyZWF0b3I+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz4NCmVuZHN0cmVhbQ1lbmRvYmoNMTEgMCBvYmoNPDwvTWV0YWRhdGEgMiAwIFIvUGFnZUxhYmVscyA2IDAgUi9QYWdlcyA4IDAgUi9UeXBlL0NhdGFsb2c+Pg1lbmRvYmoNMjMgMCBvYmoNPDwvRmlsdGVyL0ZsYXRlRGVjb2RlL0xlbmd0aCAxMD4+c3RyZWFtDQpIiQIIMAAAAAABDQplbmRzdHJlYW0NZW5kb2JqDTI4IDAgb2JqDTw8L0RlY29kZVBhcm1zPDwvQ29sdW1ucyA0L1ByZWRpY3RvciAxMj4+L0ZpbHRlci9GbGF0ZURlY29kZS9JRFs8REI3Nzc1Q0NFMjI3RjZCMzBDNDQwREY0MjIxREMzOTA+PEJGQ0NDRjNGNTdGNjEzNEFCRDNDMDRBOUU0Q0ExMDZFPl0vSW5mbyA5IDAgUi9MZW5ndGggODAvUm9vdCAxMSAwIFIvU2l6ZSAyOS9UeXBlL1hSZWYvV1sxIDIgMV0+PnN0cmVhbQ0KaN5iYgACJjDByGzIwPT/73koF0wwMUiBWYxA4v9/EMHA9I/hBVCxoDOQeH8DxH2KrIMIglFwIpD1vh5IMJqBxPpArHYgwd/KABBgAP8bEC0NCmVuZHN0cmVhbQ1lbmRvYmoNc3RhcnR4cmVmDQo0NTc2DQolJUVPRg0K";
  private readonly defaultImageBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAACXBIWXMAACE4AAAhOAFFljFgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAReSURBVHgB7ZpNTttAFMcfSUBIgAQ7xIcadt01nKDmBJATkJ6A9ASEZVeQEwAnAE5Asmq7ajhBgwSIXVMFNnyl/0dmYHD9MeOxHVf1X4oytmds/+Y9z7z5IMqVK1euXNnVGGVUS0tLzmAw2ESyIk71xsbGjkul0kkXoojKHHAZur+/30fS8cuDimhcXV3tUAQVKUNaXFysAOYrku+D8sHSzszMDPX7/TYZKjPADAuQUwDP8jHS7MJf8GNLNvH7TkP3lted6enp3zc3N98MHpMNl3bDQl38qpeXlx2PvAf42xSHvdvb25UeRJoq0IjlBfv4+LjmBcsaHx+vs/XF4SysXCEDjRTYD/b6+rrrVwYNNMMeKqccMtDIgKPASqFMR0m/IwONBNgGloWyFSV9TgZKHdgWloWy6zL99PTUIQOlChwH7MLCAgclZVkeAcgxGSg14LhgcY+acqpBhkoFOAlYDkjQdR2SoRIPPJKCvbi4aFAEJQqcNdjn8pSQsgj7fA9KQAk1UC18s2tkqdhHSwnBsspRRkduxWrhhGA5sHiJrDA6mjMZHbkVW7eUYNezimRLnpuamqqRhWIBTqGBOlGyfiALWQNntTX2kxVwirCbSvqMLBQZOC1YMVh4abTwDKPBgluRgNOEdecxeYaXjLulUcLG8V0bAf/rsKySbsa0YPGcXfwF5rGRloXF8scpKTMNSXU9AB6E5bGRVqMFWIdSgJXXwvLYSMvCqHW2riMOayYzDWkGFToKtTC7MymT3bCu9gJW1mBZocDCnaXauq6cRViWzjeshnX7GvkzC8sKBI7izlmGZQX2w6bubAuL+uU+nn89sWgWu8ICj0B35hd8eHioiKUPDvAdec0EVuzn2FYrmNeBsTS6Y7Ofw0u+3ZIINn7KY7jzyuTkZO/u7s4BzEcawnmuzerCigrbB+yGT5YuoNfihPa1sMude8Vi8QjnOLykIOnCcqiK+x3Ra0DzLMCf4x5yCVRucLGerZQKarRUd+bvym+lnQfkzUKhUOUJNh1YuPAW/n7QW9gml8fiGJ9bVc477PIa93Q4QOLQFG3Jtl8+X3OpMa1LDNgCYKvf77dMZxDF4KD+8gLD7QtVVFSL3gLswdpb4rCJ6K7udT+/bU7I78nm69LsmtyQkCVgyIt18A1XfVp/ntmQwOxtfwGzp6B8g8TOHvXdyUep7OIRLnmkDC1Zh3DhelAFotwvWQb/VbkWLFt1clmVQTFRvxd0T2NgthRa6srExEQnrPUUVuUXq7kufYbL7VGIANYQYCzet9XEsewhVLXRi9R0wl7d8fAsXnwXD+MuqaxcOqDhJPmZ3GYk+2YauqPjsmoX5T+5v9eQ57obt9eXH37/TZPgRtvC8/PzZXRN6iSAqbgVbpi2AQHP1baqqiiTeDUaNiC6KwBtWKKha1U/LS8vb8BbOKrrouKOozaekRstrvlSqbQuoqQ5EhXAbsbBA5It3u5rC5orV65cuf4n/QHtQIaxp7+QtQAAAABJRU5ErkJggg==";
  constructor() {}

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => this.renderUI();
    container.appendChild(script);
  }

  private renderUI() {
    this.container.innerHTML = "";

    const pdfTitle = document.createElement("h3");
    pdfTitle.textContent = "Chọn file PDF:";
    this.container.appendChild(pdfTitle);

    this.pdfFileInput = document.createElement("input");
    this.pdfFileInput.type = "file";
    this.pdfFileInput.accept = "application/pdf";
    this.pdfFileInput.style.display = "none"; // Ẩn vì ta load PDF sẵn
    this.container.appendChild(this.pdfFileInput);

    this.pdfContainer = document.createElement("div");
    this.pdfContainer.id = "pdf-container";
    this.pdfContainer.style.width = "800px";
    this.pdfContainer.style.height = "600px";
    this.pdfContainer.style.border = "1px solid #ccc";
    this.pdfContainer.style.overflowY = "scroll";
    this.container.appendChild(this.pdfContainer);

    const imageTitle = document.createElement("h3");
    imageTitle.textContent = "Chọn ảnh để kéo thả:";
    this.container.appendChild(imageTitle);

    this.imageFileInput = document.createElement("input");
    this.imageFileInput.type = "file";
    this.imageFileInput.accept = "image/*";
    this.imageFileInput.multiple = true;
    this.imageFileInput.style.display = "block";
    this.imageFileInput.style.marginTop = "5px";
    this.imageFileInput.style.width = "300px";
    this.container.appendChild(this.imageFileInput);

    this.imageList = document.createElement("div");
    this.imageList.id = "image-list";
    this.imageList.style.marginTop = "10px";
    this.container.appendChild(this.imageList);

    this.imageFileInput.addEventListener("change", (e) =>
      this.loadImages((e.target as HTMLInputElement).files!)
    );

    // 👉 Tự động load từ chuỗi base64
    this.loadPDFFromBase64(this.defaultPdfBase64);
    this.loadDefaultImage();
  }
  
  private loadDefaultImage() {
    const img = document.createElement("img");
    img.src = `data:image/png;base64,${this.defaultImageBase64}`;
    img.style.width = "100px";
    img.style.marginBottom = "10px";
    img.style.cursor = "grab";
    img.draggable = true;
    img.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", img.src);
    });
    this.imageList.appendChild(img);
  }

  private async loadPDFFromBase64(base64: string) {
    const raw = base64.replace(/\s/g, ""); // loại bỏ whitespace nếu có
    const binary = atob(raw);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    await this.loadPDF(bytes.buffer);
  }

  private async loadPDF(data: ArrayBuffer) {
    this.pdfDoc = await pdfjsLib.getDocument({ data }).promise;
    this.pdfContainer.innerHTML = "";
    this.imagesOnPages = {};

    for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: this.scale });

      const pageDiv = document.createElement("div");
      pageDiv.style.position = "relative";
      pageDiv.style.marginBottom = "15px";
      pageDiv.style.width = `${viewport.width}px`;
      pageDiv.style.height = `${viewport.height}px`;

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = "100%";
      canvas.style.border = "1px solid #999";

      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";

      overlay.addEventListener("dragover", (e) => e.preventDefault());
      overlay.addEventListener("drop", (e) => this.handleDrop(e, overlay));

      pageDiv.appendChild(canvas);
      pageDiv.appendChild(overlay);
      this.pdfContainer.appendChild(pageDiv);

      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
    }
  }

  private loadImages(files: FileList) {
    this.imageList.innerHTML = "";
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = (e.target as FileReader).result as string;
        const img = document.createElement("img");
        img.src = src;
        img.style.width = "100px";
        img.style.marginBottom = "10px";
        img.style.cursor = "grab";
        img.draggable = true;
        img.addEventListener("dragstart", (ev) =>
          ev.dataTransfer?.setData("text/plain", src)
        );
        this.imageList.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  private handleDrop(e: DragEvent, overlay: HTMLDivElement) {
    e.preventDefault();
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const imgSrc = e.dataTransfer?.getData("text/plain");
    if (!imgSrc) return;

    const img = document.createElement("img");
    img.src = imgSrc;
    img.style.width = "100px";
    img.style.position = "absolute";
    img.style.left = `${x - 50}px`;
    img.style.top = `${y - 50}px`;
    img.style.cursor = "grab";
    img.draggable = true;

    img.addEventListener("dragstart", (ev) => {
      this.draggingImg = img;
      this.currentOverlay = overlay;
      img.style.opacity = "0.5";
      ev.dataTransfer?.setData("text/plain", "");
    });

    img.addEventListener("dragend", () => {
      if (this.draggingImg) {
        this.draggingImg.style.opacity = "1";
        this.draggingImg = null;
        this.currentOverlay = null;
      }
    });

    overlay.appendChild(img);

    const pageNum =
      Array.from(this.pdfContainer.children).indexOf(overlay.parentElement!) +
      1;
    if (!this.imagesOnPages[pageNum]) this.imagesOnPages[pageNum] = [];
    this.imagesOnPages[pageNum].push({
      src: imgSrc,
      x: x - 50,
      y: y - 50,
      width: 100,
      height: 100,
      domElement: img,
    });
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {}
  public getOutputs(): IOutputs {
    return {};
  }

  public destroy(): void {}
}
