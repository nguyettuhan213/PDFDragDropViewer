/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    InFilePDFContent: ComponentFramework.PropertyTypes.StringProperty;
    InFileImageContent: ComponentFramework.PropertyTypes.StringProperty;
    DefaultImages: ComponentFramework.PropertyTypes.StringProperty;
}
export interface IOutputs {
    InFilePDFContent?: string;
    InFileImageContent?: string;
    XLocation?: string;
    YLocation?: string;
    PageNumber?: string;
    ImagesData?: string;
    DefaultImages?: string;
}
