import { useRef, useState, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';

interface UseQRScannerOptions {
    /** Called when a QR code is successfully decoded */
    onDetected: (data: string) => void;
}

interface UseQRScannerReturn {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    cameraActive: boolean;
    cameraError: string | null;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
}

/**
 * useQRScanner
 * Shared hook that opens the device camera, continuously grabs frames via an
 * offscreen <canvas>, decodes them with jsQR, and fires `onDetected` with the
 * decoded string once a valid QR code is found.  The scanning loop stops
 * automatically after the first successful decode.
 */
export function useQRScanner({ onDetected }: UseQRScannerOptions): UseQRScannerReturn {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Lazy-create an offscreen canvas the first time we need it
    const getCanvas = (): HTMLCanvasElement => {
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
        }
        return canvasRef.current;
    };

    const scan = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
            rafRef.current = requestAnimationFrame(scan);
            return;
        }

        const canvas = getCanvas();
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });

        if (code?.data) {
            // Found a QR code — stop scanning and surface the result
            onDetected(code.data);
            stopCamera();
            return;
        }

        // Keep scanning
        rafRef.current = requestAnimationFrame(scan);
    }, [onDetected]); // eslint-disable-line react-hooks/exhaustive-deps

    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for metadata so videoWidth/Height are available
                videoRef.current.onloadedmetadata = () => {
                    rafRef.current = requestAnimationFrame(scan);
                };
            }
            setCameraActive(true);
        } catch {
            setCameraError(
                'Camera access denied. Allow camera permissions or enter the UUID manually.'
            );
        }
    }, [scan]);

    const stopCamera = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraActive(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => () => stopCamera(), [stopCamera]);

    return { videoRef, cameraActive, cameraError, startCamera, stopCamera };
}
