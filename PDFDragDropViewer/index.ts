import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let pdfjsLib: any;

interface ImageItem {
  height: string;
  name: string;
  pageNum: string;
  src: string;
  width: string;
  x: string;
  y: string;
}

export class PDFDragDropViewer
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private container: HTMLDivElement;
  private notifyOutputChanged: () => void;

  private pdfFileInput: HTMLInputElement;
  private imageFileInput: HTMLInputElement;
  private pdfContainer: HTMLDivElement;
  private imageList: HTMLDivElement;
  private draggingImg: HTMLDivElement | null = null;
  private currentOverlay: HTMLDivElement | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private imagesOnPages: { [key: number]: any[] } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pdfDoc: any = null;
  private scale: number = 1.5;

  private lastLoadedPdfBase64: string | null = null;
  private lastLoadedImageBase64: string | null = null;
  private defaultImages: ImageItem[] = [];

  private xLocation: string = "";
  private yLocation: string = "";
  private pageNumber: string = "";

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
    this.pdfFileInput.style.display = "none";
    this.container.appendChild(this.pdfFileInput);

    this.pdfContainer = document.createElement("div");
    this.pdfContainer.id = "pdf-container";
    this.pdfContainer.style.width = "910px";
    this.pdfContainer.style.height = "1000px";
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
  }

  private async loadPDFFromBase64(base64: string) {
    const raw = base64.replace(/\s/g, "");
    const binary = atob(raw);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    await this.loadPDF(bytes.buffer);
    this.renderDefaultImagesToPDF();
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

    const pageNum =
      Array.from(this.pdfContainer.children).indexOf(overlay.parentElement!) +
      1;

    // === Trường hợp di chuyển ảnh đã có ===
    if (this.draggingImg && this.currentOverlay === overlay) {
      const newX = Math.max(0, Math.min(x - 50, overlay.clientWidth - 100));
      const newY = Math.max(0, Math.min(y - 50, overlay.clientHeight - 100));

      this.draggingImg.style.left = `${newX}px`;
      this.draggingImg.style.top = `${newY}px`;

      const imgData = this.imagesOnPages[pageNum]?.find(
        (i) => i.domElement === this.draggingImg
      );
      if (imgData) {
        imgData.x = newX;
        imgData.y = newY;
      }

      this.pageNumber = pageNum.toString();
      this.xLocation = newX.toFixed(2);
      this.yLocation = newY.toFixed(2);
      this.notifyOutputChanged();

      this.draggingImg.style.opacity = "1";
      this.draggingImg = null;
      this.currentOverlay = null;
      return;
    }

    // === Trường hợp thả ảnh mới từ danh sách ===
    const imgSrc = e.dataTransfer?.getData("text/plain");
    if (!imgSrc) return;

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = `${x - 50}px`;
    container.style.top = `${y - 50}px`;
    container.style.width = "100px";
    container.style.height = "100px";
    container.style.cursor = "grab";
    container.draggable = true;

    const img = document.createElement("img");
    img.src = imgSrc;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.pointerEvents = "none";

    const deleteBtn = document.createElement("div");
    deleteBtn.textContent = "×";
    deleteBtn.style.position = "absolute";
    deleteBtn.style.top = "-8px";
    deleteBtn.style.right = "-8px";
    deleteBtn.style.width = "18px";
    deleteBtn.style.height = "18px";
    deleteBtn.style.borderRadius = "50%";
    deleteBtn.style.backgroundColor = "red";
    deleteBtn.style.color = "white";
    deleteBtn.style.fontSize = "14px";
    deleteBtn.style.textAlign = "center";
    deleteBtn.style.lineHeight = "18px";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.userSelect = "none";
    deleteBtn.style.zIndex = "10";

    deleteBtn.addEventListener("click", () => {
      container.remove();
      if (this.imagesOnPages[pageNum]) {
        this.imagesOnPages[pageNum] = this.imagesOnPages[pageNum].filter(
          (i) => i.domElement !== container
        );
      }
      this.notifyOutputChanged();
    });

    container.addEventListener("dragstart", (ev) => {
      this.draggingImg = container;
      this.currentOverlay = overlay;
      container.style.opacity = "0.5";
      ev.dataTransfer?.setData("text/plain", "");
    });

    container.addEventListener("dragend", () => {
      if (this.draggingImg) {
        this.draggingImg.style.opacity = "1";
        this.draggingImg = null;
        this.currentOverlay = null;
      }
    });

    container.appendChild(img);
    container.appendChild(deleteBtn);
    overlay.appendChild(container);

    if (!this.imagesOnPages[pageNum]) this.imagesOnPages[pageNum] = [];
    this.imagesOnPages[pageNum].push({
      src: imgSrc,
      x: x - 50,
      y: y - 50,
      width: 100,
      height: 100,
      domElement: container,
    });

    this.pageNumber = pageNum.toString();
    this.xLocation = (x - 50).toFixed(2);
    this.yLocation = (y - 50).toFixed(2);
    this.notifyOutputChanged();
  }

  private loadDefaultImageFromBase64(base64: string) {
    this.imageList.innerHTML = "";
    const img = document.createElement("img");
    img.src = `data:image/png;base64,${base64}`;
    img.style.width = "100px";
    img.style.marginBottom = "10px";
    img.style.cursor = "grab";
    img.draggable = true;
    img.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", img.src);
    });
    this.imageList.appendChild(img);
  }

  private renderDefaultImagesToPDF() {
    if (!this.defaultImages || !Array.isArray(this.defaultImages)) return;

    this.defaultImages.forEach((img) => {
      const pageNum = parseInt(img.pageNum, 10);
      const x = parseFloat(img.x);
      const y = parseFloat(img.y);
      const width = parseFloat(img.width);
      const height = parseFloat(img.height);

      const pageDiv = this.pdfContainer.children[pageNum - 1] as HTMLDivElement;
      if (!pageDiv) return; // Loại bỏ nếu pageNum > số trang
      const overlay = pageDiv.querySelector("div") as HTMLDivElement;
      if (!overlay) return;

      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = `${x}px`;
      container.style.top = `${y}px`;
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.cursor = "grab";
      container.draggable = true;

      const imgElement = document.createElement("img");
      imgElement.src = img.src;
      imgElement.src = img.src.startsWith("data:")
        ? img.src
        : "data:image/png;base64," + img.src;
      imgElement.style.width = "100%";
      imgElement.style.height = "100%";
      imgElement.style.pointerEvents = "none";

      const deleteBtn = document.createElement("div");
      deleteBtn.textContent = "×";
      deleteBtn.style.position = "absolute";
      deleteBtn.style.top = "-8px";
      deleteBtn.style.right = "-8px";
      deleteBtn.style.width = "18px";
      deleteBtn.style.height = "18px";
      deleteBtn.style.borderRadius = "50%";
      deleteBtn.style.backgroundColor = "red";
      deleteBtn.style.color = "white";
      deleteBtn.style.fontSize = "14px";
      deleteBtn.style.textAlign = "center";
      deleteBtn.style.lineHeight = "18px";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.style.userSelect = "none";
      deleteBtn.style.zIndex = "10";

      deleteBtn.addEventListener("click", () => {
        container.remove();
        if (this.imagesOnPages[pageNum]) {
          this.imagesOnPages[pageNum] = this.imagesOnPages[pageNum].filter(
            (i) => i.domElement !== container
          );
        }
        this.notifyOutputChanged();
      });

      container.addEventListener("dragstart", (ev) => {
        this.draggingImg = container;
        this.currentOverlay = overlay;
        container.style.opacity = "0.5";
        ev.dataTransfer?.setData("text/plain", "");
      });

      container.addEventListener("dragend", () => {
        if (this.draggingImg) {
          this.draggingImg.style.opacity = "1";
          this.draggingImg = null;
          this.currentOverlay = null;
        }
      });

      container.appendChild(imgElement);
      container.appendChild(deleteBtn);
      overlay.appendChild(container);

      if (!this.imagesOnPages[pageNum]) this.imagesOnPages[pageNum] = [];
      this.imagesOnPages[pageNum].push({
        src: img.src,
        x,
        y,
        width,
        height,
        domElement: container,
      });
    });
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    const pdfBase64 = context.parameters.InFilePDFContent.raw ?? "";
    const imgBase64 = context.parameters.InFileImageContent.raw ?? "";
    if (context.parameters.DefaultImages.raw) {
      try {
        const parsed = JSON.parse(
          context.parameters.DefaultImages.raw
        ) as ImageItem[];
        this.defaultImages = parsed;
        console.log("this.defaultImages:" + this.defaultImages);
      } catch (err) {
        console.error("Lỗi parse DefaultImages:", err);
        this.defaultImages = [];
      }
    }

    if (pdfBase64 && pdfBase64 !== this.lastLoadedPdfBase64) {
      this.lastLoadedPdfBase64 = pdfBase64;
      this.loadPDFFromBase64(pdfBase64);
    }

    if (imgBase64 && imgBase64 !== this.lastLoadedImageBase64) {
      this.lastLoadedImageBase64 = imgBase64;
      this.loadDefaultImageFromBase64(imgBase64);
    }
  }

  public getOutputs(): Record<string, unknown> {
    return {
      XLocation: this.xLocation,
      YLocation: this.yLocation,
      PageNumber: this.pageNumber,
      ImagesData: JSON.stringify(this.imagesOnPages),
    };
  }

  public destroy(): void {}
}
