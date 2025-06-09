import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let pdfjsLib: any;

export class PDFDragDropViewer
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private container: HTMLDivElement;
  private notifyOutputChanged: () => void;
  private _files: string = "";

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

  constructor() {}

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;

    // Load pdf.js
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => this.renderUI();
    container.appendChild(script);
  }

  private renderUI() {
    this.container.innerHTML = ""; 

    this.pdfFileInput = document.createElement("input");
    this.pdfFileInput.type = "file";
    this.pdfFileInput.accept = "application/pdf";
    this.pdfFileInput.id = "pdf-file";
    this.pdfFileInput.style.display = "block";
    this.pdfFileInput.style.marginTop = "5px";
    this.pdfFileInput.style.opacity = "1";
    this.pdfFileInput.style.width = "300px";
    this.pdfFileInput.style.height = "auto";

    this.container.appendChild(this.pdfFileInput);

    const pdfTitle = document.createElement("h3");
    pdfTitle.textContent = "Chọn file PDF:";
    this.container.appendChild(pdfTitle);

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
    this.imageFileInput.id = "image-upload";
    this.imageFileInput.style.display = "block";
    this.imageFileInput.style.marginTop = "5px";
    this.imageFileInput.style.width = "300px";
    this.imageFileInput.style.height = "auto";
    this.imageFileInput.style.opacity = "1";
    this.container.appendChild(this.imageFileInput);

    this.imageList = document.createElement("div");
    this.imageList.id = "image-list";
    this.imageList.style.marginTop = "10px";
    this.container.appendChild(this.imageList);

    this.pdfContainer = this.container.querySelector("#pdf-container")!;
    this.imageList = this.container.querySelector("#image-list")!;

    const pdfInput = this.container.querySelector(
      "#pdf-file"
    ) as HTMLInputElement;
    pdfInput.addEventListener("change", (e) =>
      this.loadPDF((e.target as HTMLInputElement).files![0])
    );

    const imageUpload = this.container.querySelector(
      "#image-upload"
    ) as HTMLInputElement;
    imageUpload.addEventListener("change", (e) =>
      this.loadImages((e.target as HTMLInputElement).files!)
    );
  }

  private async loadPDF(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    this.pdfContainer.innerHTML = "";
    this.imagesOnPages = {};

    for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: this.scale });

      const pageDiv = document.createElement("div");
      pageDiv.className = "page-container";
      pageDiv.style.position = "relative";
      pageDiv.style.marginBottom = "15px";
      pageDiv.style.width = viewport.width + "px";
      pageDiv.style.height = viewport.height + "px";

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.className = "pdf-page";
      canvas.style.display = "block";
      canvas.style.width = "100%";
      canvas.style.border = "1px solid #999";

      const overlay = document.createElement("div");
      overlay.className = "overlay";
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

    if (this.draggingImg && this.currentOverlay === overlay) {
      // Move existing image
      let newX = x - this.draggingImg.width / 2;
      let newY = y - this.draggingImg.height / 2;
      newX = Math.max(
        0,
        Math.min(newX, overlay.clientWidth - this.draggingImg.width)
      );
      newY = Math.max(
        0,
        Math.min(newY, overlay.clientHeight - this.draggingImg.height)
      );

      this.draggingImg.style.left = newX + "px";
      this.draggingImg.style.top = newY + "px";

      const pageNum =
        Array.from(this.pdfContainer.children).indexOf(overlay.parentElement!) +
        1;
      const imgData = this.imagesOnPages[pageNum]?.find(
        (i) => i.domElement === this.draggingImg
      );
      if (imgData) {
        imgData.x = newX;
        imgData.y = newY;
      }

      this.draggingImg.style.opacity = "1";
      this.draggingImg = null;
      this.currentOverlay = null;
    } else {
      // Add new image
      const imgSrc = e.dataTransfer?.getData("text/plain");
      if (!imgSrc) return;

      const img = document.createElement("img");
      img.src = imgSrc;
      img.className = "draggable-image";
      img.style.width = "100px";
      img.style.position = "absolute";
      img.style.left = x - 50 + "px";
      img.style.top = y - 50 + "px";
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
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {}

  public getOutputs(): IOutputs {
    return {
      files: this._files,
    };
  }

  public destroy(): void {}
}
