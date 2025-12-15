import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HBCanvas } from './hb-canvas';

describe('HBCanvas', () => {
    let canvas: HBCanvas;

    beforeEach(() => {
        canvas = new HBCanvas();
    });

    it('should have default dataUrl property', () => {
        expect(canvas.dataUrl).toBe('');
    });

    it('should have default color property', () => {
        expect(canvas.color).toBe('#ff0000');
    });

    it('should have default fontSize property', () => {
        expect(canvas.fontSize).toBe(24);
    });

    it('should initialize with empty annotations array', () => {
        expect(canvas['annotations']).toEqual([]);
    });

    describe('clearAnnotations', () => {
        it('should clear all annotations', () => {
            // Add some mock annotations
            canvas['annotations'] = [
                { x: 10, y: 20, text: 'Test 1', color: '#ff0000', fontSize: 24 },
                { x: 30, y: 40, text: 'Test 2', color: '#00ff00', fontSize: 32 },
            ];

            canvas.clearAnnotations();

            expect(canvas['annotations']).toEqual([]);
        });

        it('should work when annotations array is already empty', () => {
            canvas['annotations'] = [];

            canvas.clearAnnotations();

            expect(canvas['annotations']).toEqual([]);
        });
    });

    describe('download', () => {
        it('should create download link with default filename and quality', () => {
            // Mock canvas element
            const mockCanvasElement = {
                toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mock'),
            };

            Object.defineProperty(canvas, 'canvas', {
                value: mockCanvasElement,
                writable: true,
            });

            // Mock link creation and click
            const mockLink = {
                download: '',
                href: '',
                click: vi.fn(),
            };

            vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

            canvas.download();

            expect(mockCanvasElement.toDataURL).toHaveBeenCalledWith(
                'image/jpeg',
                0.85
            );
            expect(mockLink.download).toBe('screenshot.jpg');
            expect(mockLink.href).toBe('data:image/jpeg;base64,mock');
            expect(mockLink.click).toHaveBeenCalled();
        });

        it('should use custom filename and quality', () => {
            const mockCanvasElement = {
                toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mock'),
            };

            Object.defineProperty(canvas, 'canvas', {
                value: mockCanvasElement,
                writable: true,
            });

            const mockLink = {
                download: '',
                href: '',
                click: vi.fn(),
            };

            vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

            canvas.download('custom-name.png', 0.95);

            expect(mockCanvasElement.toDataURL).toHaveBeenCalledWith(
                'image/jpeg',
                0.95
            );
            expect(mockLink.download).toBe('custom-name.jpg'); // .png replaced with .jpg
        });

        it('should replace .png extension with .jpg', () => {
            const mockCanvasElement = {
                toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mock'),
            };

            Object.defineProperty(canvas, 'canvas', {
                value: mockCanvasElement,
                writable: true,
            });

            const mockLink = {
                download: '',
                href: '',
                click: vi.fn(),
            };

            vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

            canvas.download('test.PNG');

            expect(mockLink.download).toBe('test.jpg'); // Case-insensitive replacement
        });
    });

    describe('property updates', () => {
        it('should allow setting dataUrl', () => {
            canvas.dataUrl = 'data:image/png;base64,test';
            expect(canvas.dataUrl).toBe('data:image/png;base64,test');
        });

        it('should allow setting color', () => {
            canvas.color = '#00ff00';
            expect(canvas.color).toBe('#00ff00');
        });

        it('should allow setting fontSize', () => {
            canvas.fontSize = 48;
            expect(canvas.fontSize).toBe(48);
        });
    });
});
