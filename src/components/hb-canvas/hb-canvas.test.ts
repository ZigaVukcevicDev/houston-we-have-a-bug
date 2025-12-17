import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

        afterEach(() => {
            vi.restoreAllMocks();
        });
    });


    describe('interactions', () => {
        let mockCanvasElement: any;

        beforeEach(() => {
            mockCanvasElement = {
                getBoundingClientRect: vi.fn().mockReturnValue({
                    left: 0,
                    top: 0,
                    width: 800,
                    height: 600,
                }),
                width: 800,
                height: 600,
                getContext: vi.fn().mockReturnValue({
                    clearRect: vi.fn(),
                    drawImage: vi.fn(),
                    fillText: vi.fn(),
                }),
                style: {},
            };
            Object.defineProperty(canvas, 'canvas', {
                value: mockCanvasElement,
                writable: true,
            });
            // Force context initialization
            canvas['firstUpdated']();
        });

        it('should create text input on click', () => {
            const event = {
                clientX: 100,
                clientY: 100,
            } as MouseEvent;

            canvas['_handleCanvasClick'](event);

            const input = document.body.querySelector('input');
            expect(input).toBeTruthy();
            expect(input?.style.position).toBe('fixed');

            // Cleanup
            input?.remove();
        });

        it('should add annotation on Enter', () => {
            // Click to create input
            canvas['_handleCanvasClick']({ clientX: 100, clientY: 100 } as MouseEvent);

            const input = document.body.querySelector('input')!;
            input.value = 'Test Annotation';

            // Simulate Enter key
            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            // We need to manually trigger the listener because we can't dispatch real events on unattached elements easily in happy-dom if listeners are attached via addEventListener
            // But hb-canvas attaches via addEventListener in _createTextInput.
            // So dispatchEvent should work if element is in document.body (which it is)
            input.dispatchEvent(event);

            expect(canvas['annotations']).toHaveLength(1);
            expect(canvas['annotations'][0].text).toBe('Test Annotation');
            expect(document.body.querySelector('input')).toBeNull();
        });

        it('should cancel on Escape', () => {
            canvas['_handleCanvasClick']({ clientX: 100, clientY: 100 } as MouseEvent);
            const input = document.body.querySelector('input')!;

            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            input.dispatchEvent(event);

            expect(canvas['annotations']).toHaveLength(0);
            expect(document.body.querySelector('input')).toBeNull();
        });
    });
});
