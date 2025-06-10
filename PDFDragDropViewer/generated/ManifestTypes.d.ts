/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    sampleProperty: ComponentFramework.PropertyTypes.StringProperty;
    InFilePDFContent: ComponentFramework.PropertyTypes.StringProperty;
    InFileImageContent: ComponentFramework.PropertyTypes.StringProperty;
    XLocation: ComponentFramework.PropertyTypes.StringProperty;
    YLocation: ComponentFramework.PropertyTypes.StringProperty;
    PageNumber: ComponentFramework.PropertyTypes.StringProperty;
    ImagesData: ComponentFramework.PropertyTypes.StringProperty;
    DefaultImages: ComponentFramework.PropertyTypes.StringProperty;
}
export interface IOutputs {
    sampleProperty?: string;
    InFilePDFContent?: string;
    InFileImageContent?: string;
    XLocation?: string;
    YLocation?: string;
    PageNumber?: string;
    ImagesData?: string;
    DefaultImages?: string;
}
