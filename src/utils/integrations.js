export const constructFigmaPayload = (pathData, width, height, hexColor) => {
    const colorObj = hexToFigmaColor(hexColor);
    
    // eslint-disable-next-line no-unused-vars
    const figmaNode = {
        name: "Dithered-Gravity-Layer",
        type: "VECTOR",
        guid: "0:1",
        x: 0,
        y: 0,
        width: width,
        height: height,
        fills: [
            {
                type: "SOLID",
                visible: true,
                opacity: 1,
                blendMode: "NORMAL",
                color: colorObj
            }
        ],
        vectorNetwork: {
            regions: [
                {
                    loops: [ [0] ]
                }
            ],
        },
    };

    const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        <path d="${pathData}" fill="${hexColor}" />
    </svg>`;

    const meta = btoa(JSON.stringify({ pasteID: Date.now(), fileKey: null, isScene: true }));
    return `<meta charset="utf-8"><!--(figmeta)${meta}-->${rawSvg}`;
};

export const copyHTMLToClipboard = async (htmlString) => {
    const type = "text/html";
    const blob = new Blob([htmlString], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(data);
};

export const constructFramerComponent = (pathData, hexColor) => {
    return `import React from "react"
import { addPropertyControls, ControlType } from "framer"

export default function DitherAsset(props) {
    return (
        <div style={{ ...props.style, color: props.accentColor, width: "100%", height: "100%" }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <path d="${pathData}" fill="currentColor" fillRule="evenodd" />
            </svg>
        </div>
    )
}

DitherAsset.defaultProps = {
    accentColor: "${hexColor}"
}

addPropertyControls(DitherAsset, {
    accentColor: { 
        type: ControlType.Color, 
        title: "Accent", 
        defaultValue: "${hexColor}" 
    }
})
`;
};

const hexToFigmaColor = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b, a: 1 };
};
