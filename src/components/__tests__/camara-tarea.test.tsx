import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Camera from "expo-camera";
import CamaraTarea from "../camara-tarea";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("expo-camera", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    useCameraPermissions: jest.fn(),
    CameraView: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: jest.fn().mockResolvedValue({
          uri: "file:///foto.jpg",
        }),
      }));

      React.useEffect(() => {
        props.onCameraReady?.();
      }, []);

      return React.createElement(View, {
        testID: "camera-view",
      });
    }),
  };
});

jest.mock("expo-file-system", () => ({
  Directory: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
  })),
  File: jest.fn().mockImplementation((...args: any[]) => ({
    uri: typeof args[0] === "string" ? args[0] : "file:///documentos/foto.jpg",
    copy: jest.fn(),
  })),
  Paths: {
    document: "file:///documentos",
  },
}));

describe("Pruebas de cámara", () => {
  const solicitarPermiso = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Muestra el botón para conceder permiso", async () => {
    (Camera.useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: false },
      solicitarPermiso,
    ]);

    const pantalla = await render(
      <CamaraTarea
        visible={true}
        onClose={jest.fn()}
        onPhotoCaptured={jest.fn()}
      />,
    );

    await fireEvent.press(pantalla.getByText("Conceder permiso"));

    expect(solicitarPermiso).toHaveBeenCalled();
  });

  test("Permite tomar una fotografía y entrega su URI", async () => {
    (Camera.useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: true },
      solicitarPermiso,
    ]);

    const onPhotoCaptured = jest.fn();
    const onClose = jest.fn();

    const pantalla = await render(
      <CamaraTarea
        visible={true}
        onClose={onClose}
        onPhotoCaptured={onPhotoCaptured}
      />,
    );

    await waitFor(() => {
      expect(pantalla.getByText("Tomar fotografía")).toBeTruthy();
    });

    await fireEvent.press(pantalla.getByText("Tomar fotografía"));

    await waitFor(() => {
      expect(onPhotoCaptured).toHaveBeenCalledWith(
        "file:///documentos/foto.jpg",
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});
