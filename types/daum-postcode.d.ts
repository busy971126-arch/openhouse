export {};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;
          roadAddress: string;
          jibunAddress: string;
          sido: string;
          sigungu: string;
          bname: string;
          buildingName: string;
        }) => void;
        width?: string | number;
        height?: string | number;
      }) => {
        open: (options?: { popupName?: string; popupKey?: string }) => void;
      };
    };
  }
}
