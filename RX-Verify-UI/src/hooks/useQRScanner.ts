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
 *
 * Opens the device camera, plays the stream into a <video> element, and
 * continuously grabs frames via an offscreen <canvas> to decode with jsQR.
 * Fires `onDetected` with the decoded string and stops automatically.
 */
export function useQRScanner({ onDetected }: UseQRScannerOptions): UseQRScannerReturn {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const activeRef = useRef(false); // guard so RAF loop stops after unmount

    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const getCanvas = (): HTMLCanvasElement => {
        if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
        return canvasRef.current;
    };

    // stopCamera is defined before scan so scan can call it
    const stopCamera = useCallback(() => {
        activeRef.current = false;
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.pause();
        }
        setCameraActive(false);
    }, []);

    const scan = useCallback(() => {
        if (!activeRef.current) return; // scanner stopped

        const video = videoRef.current;
        if (!video || video.paused || video.ended) return;

        // Only decode when a real frame is available
        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            const canvas = getCanvas();
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });
                if (code?.data) {
                    onDetected(code.data);
                    stopCamera();
                    return;
                }
            }
        }

        rafRef.current = requestAnimationFrame(scan);
    }, [onDetected, stopCamera]);

    const startCamera = useCallback(async () => {
        setCameraError(null);
        activeRef.current = false;

        // Prefer rear camera; fall back to any camera
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            });
        } catch {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch {
                setCameraError(
                    'Camera access denied. Allow camera permissions or enter the UUID manually.'
                );
                return;
            }
        }

        streamRef.current = stream;
        const video = videoRef.current;

        if (!video) {
            // Video element not mounted yet — stop the stream
            stream.getTracks().forEach(t => t.stop());
            setCameraError('Video element not ready. Please try again.');
            return;
        }

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true'); // required on iOS
        video.muted = true;

        try {
            await video.play();
        } catch {
            // Some browsers throw if play() is called before user gesture — ignore
        }

        activeRef.current = true;
        setCameraActive(true);

        // Start the decode loop once the video is actually playing
        const startLoop = () => {
            if (activeRef.current) {
                rafRef.current = requestAnimationFrame(scan);
            }
        };

        if (video.readyState >= video.HAVE_ENOUGH_DATA) {
            startLoop();
        } else {
            video.addEventListener('canplay', startLoop, { once: true });
        }
    }, [scan]);

    // Cleanup on unmount
    useEffect(() => () => stopCamera(), [stopCamera]);

    return { videoRef, cameraActive, cameraError, startCamera, stopCamera };
}
