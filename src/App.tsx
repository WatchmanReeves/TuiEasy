import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Minus, Square, Eraser, Undo, Redo, Download, Type, LayoutTemplate, Trash2, ZoomIn, ZoomOut, Maximize, RefreshCcw, Image as ImageIcon, Paintbrush, PaintRoller, BookmarkPlus, Upload, FolderOpen, Github, HelpCircle, Menu, Palette, Grid3X3, ChevronDown, X } from 'lucide-react';
import { getLinePoints, snapLine, getRectPoints, getSmartRectPoints } from './utils/drawing';

const STORAGE_KEY = 'tuieasy_save';

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 24;
const DEFAULT_FG = '#e4e4e7';
const DEFAULT_BG = 'transparent';
const DEFAULT_CHAR = '█';

const rgbToHex = (r: number, g: number, b: number) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

type Cell = { char: string, fg: string, bg: string };
type Grid = Cell[][];
type Tool = 'pencil' | 'line' | 'rect' | 'smart-rect' | 'eraser' | 'erase-rect' | 'text' | 'paint' | 'paint-line' | 'image-box';

const createEmptyGrid = (cols: number, rows: number): Grid => {
  const grid: Grid = [];
  for (let y = 0; y < rows; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < cols; x++) {
      row.push({ char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG });
    }
    grid.push(row);
  }
  return grid;
};

const resizeGrid = (grid: Grid, newCols: number, newRows: number): Grid => {
  const newGrid: Grid = [];
  for (let y = 0; y < newRows; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < newCols; x++) {
      if (y < grid.length && x < grid[y].length) {
        row.push(grid[y][x]);
      } else {
        row.push({ char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG });
      }
    }
    newGrid.push(row);
  }
  return newGrid;
};

const GLYPH_CATEGORIES: Record<string, string[] | Record<string, string[]>> = {
  'Box Drawing': {
    'Light': ['┌', '┐', '└', '┘', '├', '┤', '┬', '┴', '┼', '─', '│'],
    'Heavy': ['┏', '┓', '┗', '┛', '┣', '┫', '┳', '┻', '╋', '━', '┃'],
    'Double': ['╔', '╗', '╚', '╝', '╠', '╣', '╦', '╩', '╬', '═', '║'],
    'Rounded': ['╭', '╮', '╰', '╯', '├', '┤', '┬', '┴', '┼', '─', '│'],
    'Dashed': ['┄', '┅', '┆', '┇', '┈', '┉', '┊', '┋'],
    'Mixed': ['╒', '╕', '╘', '╛', '╞', '╡', '╤', '╧', '╪', '╟', '╢', '╥', '╨', '╫']
  },
  'Blocks & Shading': ['█', '▉', '▊', '▋', '▌', '▍', '▎', '▏', '▐', '▀', '▔', '▂', '▃', '▄', '▅', '▆', '▇', '░', '▒', '▓'],
  'Braille': Array.from({ length: 256 }, (_, i) => String.fromCharCode(0x2800 + i)),
  'Geometry': ['■', '□', '▪', '▫', '▲', '▼', '◄', '►', '△', '▽', '◁', '▷', '●', '○', '♦', '♢', '★', '☆', '╱', '╲', '╳'],
  'ASCII': ['*', '+', '-', '=', '#', '@', '%', '&', '.', ',', ':', ';'],
  'Alphanumeric': [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789']
};

const LIBRARY_STORAGE_KEY = 'tuieasy_library';

const generateFileExplorerTemplate = () => {
  const grid = createEmptyGrid(80, 24);
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 80; x++) {
      if (y === 0 || y === 23) grid[y][x].char = '─';
      if (x === 0 || x === 79) grid[y][x].char = '│';
    }
  }
  grid[0][0].char = '┌'; grid[0][79].char = '┐';
  grid[23][0].char = '└'; grid[23][79].char = '┘';
  for (let y = 1; y < 23; y++) grid[y][20].char = '│';
  grid[0][20].char = '┬'; grid[23][20].char = '┴';
  for (let x = 1; x < 79; x++) grid[2][x].char = '─';
  grid[2][0].char = '├'; grid[2][79].char = '┤';
  grid[2][20].char = '┼';
  const addText = (x: number, y: number, text: string) => {
    for (let i = 0; i < text.length; i++) grid[y][x+i].char = text[i];
  };
  addText(2, 1, "EXPLORER");
  addText(22, 1, "C:\\Projects\\TUI-Easy");
  addText(2, 4, "📁 src");
  addText(2, 5, "📁 public");
  addText(2, 6, "📄 package.json");
  addText(2, 7, "📄 README.md");
  return grid;
};

const generateChatTemplate = () => {
  const grid = createEmptyGrid(80, 24);
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 80; x++) {
      if (y === 0 || y === 23) grid[y][x].char = '─';
      if (x === 0 || x === 79) grid[y][x].char = '│';
    }
  }
  grid[0][0].char = '┌'; grid[0][79].char = '┐';
  grid[23][0].char = '└'; grid[23][79].char = '┘';
  for (let y = 1; y < 23; y++) grid[y][60].char = '│';
  grid[0][60].char = '┬'; grid[23][60].char = '┴';
  for (let x = 1; x < 59; x++) grid[20][x].char = '─';
  grid[20][0].char = '├'; grid[20][60].char = '┤';
  const addText = (x: number, y: number, text: string, fg = DEFAULT_FG) => {
    for (let i = 0; i < text.length; i++) {
      grid[y][x+i].char = text[i];
      grid[y][x+i].fg = fg;
    }
  };
  addText(62, 1, "ONLINE (3)", "#14b8a6");
  addText(62, 3, "● watchman", "#10b981");
  addText(62, 4, "● tui_fan", "#10b981");
  addText(62, 5, "○ guest_99", "#71717a");
  addText(2, 2, "[watchman]: Hey, check out this new TUI builder!", "#3b82f6");
  addText(2, 4, "[tui_fan]: Whoa, that looks awesome. Can I import ANSI?", "#a855f7");
  addText(2, 6, "[watchman]: Yeah, just added that feature.", "#3b82f6");
  addText(2, 21, "> Type your message here...", "#71717a");
  return grid;
};

const PREMADE_TEMPLATES = [
  { id: 'premade-1', name: 'File Explorer', cols: 80, rows: 24, getGrid: generateFileExplorerTemplate },
  { id: 'premade-2', name: 'Chat Interface', cols: 80, rows: 24, getGrid: generateChatTemplate }
];

const ToolButton = ({ icon, active, onClick, tooltip, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`p-3 rounded-xl transition-all duration-200 ${
      disabled ? 'opacity-30 cursor-not-allowed' :
      active ? 'bg-teal-600 text-zinc-100 shadow-md' : 
      'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
    }`}
  >
    {icon}
  </button>
);

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [cols, setCols] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return saved.cols || DEFAULT_COLS; } catch { return DEFAULT_COLS; }
  });
  const [rows, setRows] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return saved.rows || DEFAULT_ROWS; } catch { return DEFAULT_ROWS; }
  });
  const [inputCols, setInputCols] = useState(cols.toString());
  const [inputRows, setInputRows] = useState(rows.toString());
  
  const [history, setHistory] = useState<Grid[]>(() => {
    try { 
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); 
      if (saved.grid && Array.isArray(saved.grid)) return [saved.grid];
    } catch {}
    return [createEmptyGrid(cols, rows)];
  });
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [tool, setTool] = useState<Tool>('pencil');
  const [char, setChar] = useState<string>(DEFAULT_CHAR);
  const [glyphCategory, setGlyphCategory] = useState<string>('Box Drawing');
  const [boxWeight, setBoxWeight] = useState<string>('Light');
  const [fg, setFg] = useState<string>(DEFAULT_FG);
  const [bg, setBg] = useState<string>(DEFAULT_BG);
  const [fill, setFill] = useState<boolean>(false);

  const [savedColors, setSavedColors] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('antigravity_colors') || '[]'); } catch { return []; }
  });
  const [savedGlyphs, setSavedGlyphs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('antigravity_glyphs') || '[]'); } catch { return []; }
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [preview, setPreview] = useState<{x: number, y: number, char: string, fg: string, bg: string}[]>([]);
  const [textCursor, setTextCursor] = useState<{x: number, y: number, startX: number} | null>(null);
  const [tick, setTick] = useState(0);
  
  const [zoom, setZoom] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ansiInputRef = useRef<HTMLInputElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importImageSrc, setImportImageSrc] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'half-block' | 'braille'>('half-block');
  const [importThreshold, setImportThreshold] = useState(128);
  const [importInvert, setImportInvert] = useState(false);
  const [importBox, setImportBox] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savedDesigns, setSavedDesigns] = useState<{id: string, name: string, cols: number, rows: number, grid: Grid}[]>(() => {
    try { return JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY) || '[]'); } catch { return []; }
  });

  const [helpOpen, setHelpOpen] = useState(false);

  // Mobile bottom sheet state
  const [mobileToolSheet, setMobileToolSheet] = useState(false);
  const [mobileColorSheet, setMobileColorSheet] = useState(false);
  const [mobileGlyphSheet, setMobileGlyphSheet] = useState(false);
  const [mobileDockOpen, setMobileDockOpen] = useState(false);

  const haptic = () => { try { navigator.vibrate?.(10); } catch {} };
  const closeMobileAll = () => { setMobileDockOpen(false); setMobileToolSheet(false); setMobileColorSheet(false); setMobileGlyphSheet(false); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImportImageSrc(url);
      setImportModalOpen(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnsiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) parseAnsi(text);
    };
    reader.readAsText(file);
    if (ansiInputRef.current) ansiInputRef.current.value = '';
  };

  const parseAnsi = (text: string) => {
    const lines = text.split('\n');
    let maxCols = 0;
    const parsedGrid: Grid = [];
    
    for (const line of lines) {
      if (!line && parsedGrid.length > 0) continue; 
      const row: Cell[] = [];
      let currentFg = DEFAULT_FG;
      let currentBg = DEFAULT_BG;
      
      const regex = /\x1b\[[0-9;]*m|[\s\S]/g;
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        const token = match[0];
        if (token.startsWith('\x1b[')) {
          if (token === '\x1b[0m') { currentFg = DEFAULT_FG; currentBg = DEFAULT_BG; }
          else if (token === '\x1b[39m') currentFg = DEFAULT_FG;
          else if (token === '\x1b[49m') currentBg = DEFAULT_BG;
          else {
            const codes = token.match(/\d+/g);
            if (codes && codes.length >= 3) {
              if (codes[0] === '38' && codes[1] === '2') {
                currentFg = rgbToHex(parseInt(codes[2]), parseInt(codes[3]), parseInt(codes[4]));
              } else if (codes[0] === '48' && codes[1] === '2') {
                currentBg = rgbToHex(parseInt(codes[2]), parseInt(codes[3]), parseInt(codes[4]));
              }
            }
          }
        } else {
          if (token !== '\r') {
            row.push({ char: token, fg: currentFg, bg: currentBg });
          }
        }
      }
      maxCols = Math.max(maxCols, row.length);
      parsedGrid.push(row);
    }
    
    for (const row of parsedGrid) {
      while (row.length < maxCols) {
        row.push({ char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG });
      }
    }
    
    const newCols = maxCols || DEFAULT_COLS;
    const newRows = parsedGrid.length || DEFAULT_ROWS;
    
    setCols(newCols);
    setRows(newRows);
    setInputCols(newCols.toString());
    setInputRows(newRows.toString());
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(parsedGrid);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  };

  const saveToLibrary = () => {
    if (!saveName.trim()) return;
    const newDesign = { id: Date.now().toString(), name: saveName.trim(), cols, rows, grid: history[historyIndex] };
    const newSaved = [...savedDesigns, newDesign];
    setSavedDesigns(newSaved);
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(newSaved));
    setSavePromptOpen(false);
    setSaveName('');
  };

  const loadFromLibrary = (design: {cols: number, rows: number, grid: Grid}) => {
    setCols(design.cols);
    setRows(design.rows);
    setInputCols(design.cols.toString());
    setInputRows(design.rows.toString());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(design.grid);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
    setLibraryOpen(false);
  };

  const deleteFromLibrary = (id: string) => {
    const newSaved = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(newSaved);
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(newSaved));
    setConfirmDeleteId(null);
  };

  const processImport = () => {
    if (!importImageSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = img.width;
      const h = img.height;
      const points: {x: number, y: number, char: string, fg: string, bg: string}[] = [];

      const targetCols = importBox ? importBox.w : cols;
      const targetRows = importBox ? importBox.h : rows;
      const targetX = importBox ? importBox.x : 0;
      const targetY = importBox ? importBox.y : 0;

      const getPixel = (imgData: ImageData, px: number, py: number) => {
        if (px < 0 || px >= imgData.width || py < 0 || py >= imgData.height) return null;
        const i = (py * imgData.width + px) * 4;
        if (imgData.data[i+3] < 128) return null; // Transparent
        return { r: imgData.data[i], g: imgData.data[i+1], b: imgData.data[i+2] };
      };

      if (importMode === 'half-block') {
        const scale = Math.min(targetCols / w, (targetRows * 2) / h);
        const dw = Math.floor(w * scale);
        const dh = Math.floor(h * scale);
        canvas.width = dw;
        canvas.height = dh;
        ctx.drawImage(img, 0, 0, dw, dh);
        const imgData = ctx.getImageData(0, 0, dw, dh);

        const offX = Math.floor((targetCols - dw) / 2);
        const offY = Math.floor((targetRows * 2 - dh) / 2);

        for (let y = 0; y < targetRows; y++) {
          for (let x = 0; x < targetCols; x++) {
            const imgX = x - offX;
            const imgY1 = y * 2 - offY;
            const imgY2 = y * 2 + 1 - offY;

            const p1 = getPixel(imgData, imgX, imgY1);
            const p2 = getPixel(imgData, imgX, imgY2);

            if (!p1 && !p2) continue;

            if (p1 && p2) {
              points.push({ x: x + targetX, y: y + targetY, char: '▀', fg: rgbToHex(p1.r, p1.g, p1.b), bg: rgbToHex(p2.r, p2.g, p2.b) });
            } else if (p1) {
              points.push({ x: x + targetX, y: y + targetY, char: '▀', fg: rgbToHex(p1.r, p1.g, p1.b), bg: DEFAULT_BG });
            } else if (p2) {
              points.push({ x: x + targetX, y: y + targetY, char: '▄', fg: rgbToHex(p2.r, p2.g, p2.b), bg: DEFAULT_BG });
            }
          }
        }
      } else {
        const scale = Math.min((targetCols * 2) / w, (targetRows * 4) / h);
        const dw = Math.floor(w * scale);
        const dh = Math.floor(h * scale);
        canvas.width = dw;
        canvas.height = dh;
        ctx.drawImage(img, 0, 0, dw, dh);
        const imgData = ctx.getImageData(0, 0, dw, dh);

        const offX = Math.floor((targetCols * 2 - dw) / 2);
        const offY = Math.floor((targetRows * 4 - dh) / 2);

        for (let y = 0; y < targetRows; y++) {
          for (let x = 0; x < targetCols; x++) {
            let brailleVal = 0;
            let rSum = 0, gSum = 0, bSum = 0, count = 0;

            const checkDot = (dx: number, dy: number, bit: number) => {
              const imgX = x * 2 + dx - offX;
              const imgY = y * 4 + dy - offY;
              const p = getPixel(imgData, imgX, imgY);
              if (p) {
                const brightness = (p.r + p.g + p.b) / 3;
                const isOn = importInvert ? brightness < importThreshold : brightness >= importThreshold;
                if (isOn) {
                  brailleVal |= bit;
                  rSum += p.r; gSum += p.g; bSum += p.b; count++;
                }
              }
            };

            checkDot(0, 0, 0x1);
            checkDot(0, 1, 0x2);
            checkDot(0, 2, 0x4);
            checkDot(1, 0, 0x8);
            checkDot(1, 1, 0x10);
            checkDot(1, 2, 0x20);
            checkDot(0, 3, 0x40);
            checkDot(1, 3, 0x80);

            if (brailleVal > 0) {
              const char = String.fromCharCode(0x2800 + brailleVal);
              const fgHex = rgbToHex(Math.round(rSum/count), Math.round(gSum/count), Math.round(bSum/count));
              points.push({ x: x + targetX, y: y + targetY, char, fg: fgHex, bg: DEFAULT_BG });
            }
          }
        }
      }

      commitToGrid(points);
      setImportModalOpen(false);
      setImportBox(null);
    };
    img.src = importImageSrc;
  };

  const handleResizeGrid = (newCols: number, newRows: number) => {
    if (newCols < 1 || newRows < 1) return;
    setCols(newCols);
    setRows(newRows);
    setHistory(prev => prev.map(grid => resizeGrid(grid, newCols, newRows)));
  };

  useEffect(() => {
    const saveState = () => {
      const currentGrid = history[historyIndex];
      if (!currentGrid) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          cols,
          rows,
          grid: currentGrid
        }));
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }
    };
    const timeout = setTimeout(saveState, 500);
    return () => clearTimeout(timeout);
  }, [history, historyIndex, cols, rows]);

  const commitToGrid = useCallback((newPoints: {x: number, y: number, char: string, fg: string, bg: string}[]) => {
    if (newPoints.length === 0) return;
    
    const validPoints = newPoints.filter(p => p.y >= 0 && p.y < rows && p.x >= 0 && p.x < cols);
    if (validPoints.length === 0) return;

    setHistory(prevHistory => {
      const currentGrid = prevHistory[historyIndex];
      if (!currentGrid) return prevHistory;
      const newGrid = currentGrid.map(row => [...row]);
      validPoints.forEach(p => {
        newGrid[p.y][p.x] = { char: p.char, fg: p.fg, bg: p.bg };
      });
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(newGrid);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, cols, rows]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPreview([]);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPreview([]);
    }
  }, [historyIndex, history.length]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setHelpOpen(h => !h);
        return;
      }
      if (e.key === 'Escape' && helpOpen) {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo, redo, helpOpen]);

  const clearCanvas = () => {
    setConfirmClear(true);
  };

  const executeClearCanvas = () => {
    const points = getRectPoints(0, 0, cols - 1, rows - 1, true, false, false).map(p => ({
      ...p, char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG
    }));
    commitToGrid(points);
    setConfirmClear(false);
  };

  const exportAnsi = () => {
    const currentGrid = history[historyIndex];
    let out = '';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = currentGrid[y][x];
        const hexToRgb = (hex: string) => {
          if (hex === 'transparent') return null;
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const fgRgb = hexToRgb(cell.fg);
        const bgRgb = hexToRgb(cell.bg);
        
        if (fgRgb) {
          out += `\x1b[38;2;${fgRgb.r};${fgRgb.g};${fgRgb.b}m`;
        } else {
          out += `\x1b[39m`;
        }
        
        if (bgRgb) {
          out += `\x1b[48;2;${bgRgb.r};${bgRgb.g};${bgRgb.b}m`;
        } else {
          out += `\x1b[49m`;
        }
        out += cell.char;
      }
      out += '\x1b[0m\n';
    }
    
    const blob = new Blob([out], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout.ans';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGridCoords = (e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellW = rect.width / cols;
    const cellH = rect.height / rows;
    const col = Math.max(0, Math.min(cols - 1, Math.floor(x / cellW)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor(y / cellH)));
    return { col, row };
  };

  const updatePreview = (x0: number, y0: number, x1: number, y1: number, shiftKey: boolean, ctrlKey: boolean) => {
    let points: any[] = [];
    
    if (tool === 'line' || tool === 'paint-line') {
      let targetX = x1;
      let targetY = y1;
      if (shiftKey) {
        const snapped = snapLine(x0, y0, x1, y1);
        targetX = snapped.x;
        targetY = snapped.y;
      }
      points = getLinePoints(x0, y0, targetX, targetY).map(p => ({ 
        ...p, 
        char: tool === 'paint-line' ? (history[historyIndex]?.[p.y]?.[p.x]?.char || ' ') : char, 
        fg, 
        bg 
      }));
    } else if (tool === 'rect' || tool === 'erase-rect' || tool === 'image-box') {
      points = getRectPoints(x0, y0, x1, y1, fill, shiftKey, ctrlKey).map(p => ({ 
        ...p, 
        char: tool === 'erase-rect' ? ' ' : (tool === 'image-box' ? '▒' : char), 
        fg: tool === 'image-box' ? '#14b8a6' : fg, 
        bg: tool === 'erase-rect' ? DEFAULT_BG : (tool === 'image-box' ? 'transparent' : bg) 
      }));
    } else if (tool === 'smart-rect') {
      points = getSmartRectPoints(x0, y0, x1, y1, fill, shiftKey, ctrlKey, fg, bg);
    }
    
    setPreview(points);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (e.button !== 0 && e.pointerType === 'mouse') return; // Only left click for mouse
    const { col, row } = getGridCoords(e, canvasRef.current!);
    
    if (tool === 'text') {
      setTextCursor({ x: col, y: row, startX: col });
      return;
    } else {
      setTextCursor(null);
    }

    setIsDrawing(true);
    setStartPos({ x: col, y: row });
    
    if (tool === 'pencil' || tool === 'eraser' || tool === 'paint') {
      const currentGrid = history[historyIndex];
      const pChar = tool === 'eraser' ? ' ' : (tool === 'paint' ? currentGrid[row][col].char : char);
      const pBg = tool === 'eraser' ? DEFAULT_BG : bg;
      setPreview([{ x: col, y: row, char: pChar, fg, bg: pBg }]);
    } else {
      updatePreview(col, row, col, row, e.shiftKey, e.ctrlKey);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const { col, row } = getGridCoords(e, canvasRef.current!);
    
    if (tool === 'pencil' || tool === 'eraser' || tool === 'paint') {
      const lastPos = preview.length > 0 ? preview[preview.length - 1] : startPos;
      const points = getLinePoints(lastPos.x, lastPos.y, col, row);
      
      const pBg = tool === 'eraser' ? DEFAULT_BG : bg;
      const currentGrid = history[historyIndex];
      
      const newPoints = points.map(p => ({ 
        ...p, 
        char: tool === 'eraser' ? ' ' : (tool === 'paint' ? currentGrid[p.y]?.[p.x]?.char || ' ' : char), 
        fg, 
        bg: pBg 
      }));
      
      const merged = [...preview];
      newPoints.forEach(np => {
        if (!merged.find(m => m.x === np.x && m.y === np.y)) {
          merged.push(np);
        }
      });
      setPreview(merged);
    } else {
      updatePreview(startPos.x, startPos.y, col, row, e.shiftKey, e.ctrlKey);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (tool === 'image-box' && startPos) {
      const { col, row } = getGridCoords(e, canvasRef.current!);
      const minX = Math.min(startPos.x, col);
      const minY = Math.min(startPos.y, row);
      const maxX = Math.max(startPos.x, col);
      const maxY = Math.max(startPos.y, row);
      setImportBox({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
      fileInputRef.current?.click();
      setPreview([]);
      setStartPos(null);
      return;
    }

    commitToGrid(preview);
    setPreview([]);
    setStartPos(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (tool !== 'text' || !textCursor) return;
      
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        commitToGrid([{ x: textCursor.x, y: textCursor.y, char: e.key, fg, bg }]);
        setTextCursor(prev => prev ? { ...prev, x: prev.x + 1 } : null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setTextCursor(prev => prev ? { x: prev.startX, y: prev.y + 1, startX: prev.startX } : null);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        const newX = Math.max(textCursor.startX, textCursor.x - 1);
        commitToGrid([{ x: newX, y: textCursor.y, char: ' ', fg, bg: DEFAULT_BG }]);
        setTextCursor({ ...textCursor, x: newX });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tool, textCursor, fg, bg, commitToGrid]);

  useEffect(() => {
    if (tool !== 'text' || !textCursor) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [tool, textCursor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      setTick(t => t + 1);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    const cellW = rect.width / cols;
    const cellH = rect.height / rows;

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = `${cellH * 0.8}px "JetBrains Mono", "Courier New", monospace`;

    ctx.fillStyle = '#0a0a0a'; // zinc-950
    ctx.fillRect(0, 0, rect.width, rect.height);

    const currentGrid = history[historyIndex];
    if (!currentGrid) return;

    const previewMap = new Map();
    preview.forEach(p => previewMap.set(`${p.x},${p.y}`, p));

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = currentGrid[y]?.[x];
        if (!cell) continue;
        const p = previewMap.get(`${x},${y}`);
        const drawCell = p || cell;

        if (drawCell.bg !== 'transparent') {
          ctx.fillStyle = drawCell.bg;
          ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
        }

        if (drawCell.char && drawCell.char !== ' ') {
          ctx.fillStyle = drawCell.fg === 'transparent' ? '#e4e4e7' : drawCell.fg;
          ctx.fillText(drawCell.char, x * cellW + cellW / 2, y * cellH + cellH / 2 + (cellH * 0.05));
        }
      }
    }

    if (tool === 'text' && textCursor) {
      const time = Date.now();
      if (Math.floor(time / 500) % 2 === 0) {
        ctx.fillStyle = fg === 'transparent' ? '#e4e4e7' : fg;
        ctx.fillRect(textCursor.x * cellW, textCursor.y * cellH, cellW, cellH);
        ctx.fillStyle = bg === 'transparent' ? '#0a0a0a' : bg;
        const cell = currentGrid[textCursor.y]?.[textCursor.x];
        if (cell && cell.char !== ' ') {
          ctx.fillText(cell.char, textCursor.x * cellW + cellW / 2, textCursor.y * cellH + cellH / 2 + (cellH * 0.05));
        }
      }
    }

    ctx.strokeStyle = '#1f1f1f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= cols; x++) {
      ctx.moveTo(x * cellW, 0);
      ctx.lineTo(x * cellW, rect.height);
    }
    for (let y = 0; y <= rows; y++) {
      ctx.moveTo(0, y * cellH);
      ctx.lineTo(rect.width, y * cellH);
    }
    ctx.stroke();

  }, [history, historyIndex, preview, tool, textCursor, fg, bg, tick, cols, rows]);

  const zoomIn = () => setZoom(z => Math.min(5, z * 1.2));
  const zoomOut = () => setZoom(z => Math.max(0.2, z / 1.2));
  const zoomReset = () => setZoom(1);
  const zoomFit = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 64;
    const availableW = rect.width - padding;
    const availableH = rect.height - padding;
    
    // Base cell size is 10x20
    const baseW = cols * 10;
    const baseH = rows * 20;
    
    const scaleX = availableW / baseW;
    const scaleY = availableH / baseH;
    setZoom(Math.min(scaleX, scaleY));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(z => Math.max(0.1, Math.min(5, z * zoomFactor)));
    }
  };

  // Base cell size for 100% zoom
  const baseCellW = 10;
  const baseCellH = 20;

  return (
    <div className="flex h-[100dvh] bg-zinc-950 text-zinc-300 font-sans overflow-hidden">
      <div className="hidden lg:flex w-16 flex-col items-center py-4 bg-zinc-900 border-r border-zinc-800 gap-4 z-10 shrink-0 overflow-y-auto">
        <ToolButton icon={<Pencil />} active={tool === 'pencil'} onClick={() => setTool('pencil')} tooltip="Pencil" />
        <ToolButton icon={<Paintbrush />} active={tool === 'paint'} onClick={() => setTool('paint')} tooltip="Paint Color (Keep Character)" />
        <ToolButton icon={<PaintRoller />} active={tool === 'paint-line'} onClick={() => setTool('paint-line')} tooltip="Paint Line (Keep Character)" />
        <ToolButton icon={<Minus />} active={tool === 'line'} onClick={() => setTool('line')} tooltip="Line (Shift to snap)" />
        <ToolButton icon={<Square />} active={tool === 'rect'} onClick={() => setTool('rect')} tooltip="Rectangle (Shift: Square, Ctrl: Center)" />
        <ToolButton icon={<LayoutTemplate />} active={tool === 'smart-rect'} onClick={() => setTool('smart-rect')} tooltip="Smart Box" />
        <ToolButton icon={<Type />} active={tool === 'text'} onClick={() => setTool('text')} tooltip="Text" />
        <ToolButton icon={<Eraser />} active={tool === 'eraser'} onClick={() => setTool('eraser')} tooltip="Eraser" />
        <ToolButton icon={<Square className="text-zinc-500" />} active={tool === 'erase-rect'} onClick={() => setTool('erase-rect')} tooltip="Erase Rectangle (Shift: Square, Ctrl: Center)" />
        
        <div className="w-8 h-px bg-zinc-800 my-2" />
        
        <ToolButton icon={<ImageIcon />} active={tool === 'image-box'} onClick={() => setTool('image-box')} tooltip="Import Image (Draw Box)" />
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

        <div className="w-8 h-px bg-zinc-800 my-2" />
        
        <ToolButton icon={<Undo />} onClick={undo} disabled={historyIndex <= 0} tooltip="Undo" />
        <ToolButton icon={<Redo />} onClick={redo} disabled={historyIndex >= history.length - 1} tooltip="Redo" />
        
        <div className="w-8 h-px bg-zinc-800 my-2" />
        
        <ToolButton icon={<LayoutTemplate />} onClick={() => setLibraryOpen(true)} tooltip="Library & Templates" />
        <div className="w-8 h-px bg-zinc-800 my-2" />
        
        <ToolButton icon={<Trash2 />} onClick={clearCanvas} tooltip="Clear Canvas" />
        <ToolButton icon={<Download />} onClick={exportAnsi} tooltip="Export ANSI" />
        <ToolButton icon={<FolderOpen />} onClick={() => ansiInputRef.current?.click()} tooltip="Import ANSI" />
        <input type="file" ref={ansiInputRef} onChange={handleAnsiUpload} accept=".ans,.txt" className="hidden" />
      </div>

      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-2 lg:px-4 justify-between shrink-0 z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 select-none" title="TUI Easy - Too Easy!">
              <img src="/logo-icon.png" alt="" className="h-9 w-9 rounded-lg" />
              <span className="text-zinc-100 font-bold tracking-wide text-lg">Tui<span className="text-teal-400">Easy</span></span>
            </div>
            
            <div className="w-px h-4 bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>Size:</span>
              <input 
                type="number" 
                value={inputCols} 
                onChange={e => setInputCols(e.target.value)}
                onBlur={() => handleResizeGrid(parseInt(inputCols) || DEFAULT_COLS, rows)}
                onKeyDown={e => e.key === 'Enter' && handleResizeGrid(parseInt(inputCols) || DEFAULT_COLS, rows)}
                className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-center focus:border-teal-400 focus:outline-none"
                min="1"
              />
              <span>×</span>
              <input 
                type="number" 
                value={inputRows} 
                onChange={e => setInputRows(e.target.value)}
                onBlur={() => handleResizeGrid(cols, parseInt(inputRows) || DEFAULT_ROWS)}
                onKeyDown={e => e.key === 'Enter' && handleResizeGrid(cols, parseInt(inputRows) || DEFAULT_ROWS)}
                className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-center focus:border-teal-400 focus:outline-none"
                min="1"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={zoomOut} className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded" title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <span className="text-xs text-zinc-500 font-mono w-12 text-center hidden sm:inline">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded" title="Zoom In">
              <ZoomIn size={18} />
            </button>
            <div className="w-px h-4 bg-zinc-700 mx-0.5 hidden sm:block" />
            <button onClick={zoomReset} className="hidden sm:block p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded" title="Reset Zoom (100%)">
              <RefreshCcw size={18} />
            </button>
            <button onClick={zoomFit} className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded" title="Fit to Screen">
              <Maximize size={18} />
            </button>
            <div className="w-px h-4 bg-zinc-700 mx-0.5 hidden sm:block" />
            <button onClick={() => setHelpOpen(true)} className="hidden sm:block p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded" title="Help & Shortcuts (?)">
              <HelpCircle size={18} />
            </button>
            <a href="https://github.com/WatchmanReeves/TuiEasy" target="_blank" rel="noopener noreferrer" className="hidden sm:block p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded" title="GitHub">
              <Github size={18} />
            </a>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-zinc-950 relative"
          onWheel={handleWheel}
          style={{ overscrollBehavior: 'contain' }}
          onPointerDown={() => closeMobileAll()}
        >
          <div className="min-w-full min-h-full flex items-center justify-center p-8">
            <div 
              className="relative shadow-2xl shadow-black/50 ring-1 ring-zinc-800 bg-[#0a0a0a] shrink-0"
              style={{ 
                width: `${cols * baseCellW * zoom}px`, 
                height: `${rows * baseCellH * zoom}px` 
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onContextMenu={e => e.preventDefault()}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-64 bg-zinc-900 border-l border-zinc-800 flex-col z-10 shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Colors</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Foreground</label>
              <input type="color" value={fg} onChange={e => setFg(e.target.value)} className="w-8 h-8 bg-zinc-800 border border-zinc-700 cursor-pointer rounded" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Background</label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setBg('transparent')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${bg === 'transparent' ? 'bg-teal-600 border-teal-500 text-zinc-100' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'}`}
                  title="Transparent Background"
                >
                  Clear
                </button>
                <input type="color" value={bg === 'transparent' ? '#000000' : bg} onChange={e => setBg(e.target.value)} className="w-8 h-8 bg-zinc-800 border border-zinc-700 cursor-pointer rounded" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Options</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-zinc-100 transition-colors">
            <input type="checkbox" checked={fill} onChange={e => setFill(e.target.checked)} className="rounded border-zinc-700 bg-zinc-800 text-teal-400 focus:ring-teal-400" />
            Fill Shapes
          </label>
        </div>

        <div className="p-4 border-b border-zinc-800">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex justify-between items-center">
            Saved Colors
            <button onClick={() => setSavedColors(prev => [...new Set([...prev, fg])])} className="text-teal-400 hover:text-teal-300 transition-colors" title="Save current foreground color">
              <BookmarkPlus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedColors.map(c => (
              <button 
                key={c} 
                onClick={() => setFg(c)} 
                onContextMenu={(e) => { e.preventDefault(); setSavedColors(prev => prev.filter(sc => sc !== c)); }} 
                className="w-6 h-6 rounded border border-zinc-700 hover:scale-110 transition-transform" 
                style={{ backgroundColor: c }} 
                title="Left click: Set FG, Right click: Remove" 
              />
            ))}
            {savedColors.length === 0 && <div className="text-zinc-600 text-xs italic">No saved colors</div>}
          </div>
        </div>

        <div className="p-4 border-b border-zinc-800">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex justify-between items-center">
            Favorite Glyphs
            <button onClick={() => setSavedGlyphs(prev => [...new Set([...prev, char])])} className="text-teal-400 hover:text-teal-300 transition-colors" title="Save current character">
              <BookmarkPlus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedGlyphs.map(g => (
              <button 
                key={g} 
                onClick={() => setChar(g)} 
                onContextMenu={(e) => { e.preventDefault(); setSavedGlyphs(prev => prev.filter(sg => sg !== g)); }} 
                className="w-8 h-8 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center hover:border-teal-400 hover:text-teal-400 transition-colors" 
                title="Left click: Use, Right click: Remove" 
              >
                {g}
              </button>
            ))}
            {savedGlyphs.length === 0 && <div className="text-zinc-600 text-xs italic">No saved glyphs</div>}
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col min-h-0">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 shrink-0">Glyphs</h3>
          
          <div className="mb-3 shrink-0">
            <select 
              value={glyphCategory} 
              onChange={e => setGlyphCategory(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded p-1.5 outline-none focus:border-teal-400 cursor-pointer"
            >
              {Object.keys(GLYPH_CATEGORIES).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {glyphCategory === 'Box Drawing' && (
            <div className="mb-3 flex flex-wrap gap-1 shrink-0">
              {Object.keys(GLYPH_CATEGORIES['Box Drawing']).map(weight => (
                <button
                  key={weight}
                  onClick={() => setBoxWeight(weight)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${boxWeight === weight ? 'bg-teal-600 text-zinc-100' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  {weight}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
            <div className="grid grid-cols-6 gap-1">
              {(glyphCategory === 'Box Drawing' 
                ? (GLYPH_CATEGORIES['Box Drawing'] as Record<string, string[]>)[boxWeight] 
                : GLYPH_CATEGORIES[glyphCategory] as string[]
              ).map(g => (
                <button
                  key={g}
                  onClick={() => setChar(g)}
                  className={`w-8 h-8 flex items-center justify-center font-mono text-lg rounded hover:bg-zinc-700 transition-colors ${char === g ? 'bg-teal-600/20 text-teal-400 ring-1 ring-teal-500' : 'text-zinc-300'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE FLOATING PILL ===== */}
      {!mobileDockOpen && !mobileToolSheet && !mobileColorSheet && !mobileGlyphSheet && (
        <button
          onClick={() => { setMobileDockOpen(true); haptic(); }}
          className="fixed bottom-6 right-6 z-40 lg:hidden w-14 h-14 rounded-full bg-teal-600 shadow-lg shadow-teal-900/40 flex items-center justify-center text-white active:scale-95 transition-transform"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <Menu size={24} />
        </button>
      )}

      {/* ===== MOBILE EXPANDED DOCK ===== */}
      {mobileDockOpen && (
        <div
          className="fixed bottom-6 right-4 left-4 z-40 lg:hidden flex items-center justify-between bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl px-3 py-2.5 shadow-2xl shadow-black/50"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <button onClick={() => { setMobileToolSheet(s => !s); setMobileColorSheet(false); setMobileGlyphSheet(false); haptic(); }} className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-colors ${mobileToolSheet ? 'text-teal-400 bg-teal-600/10' : 'text-zinc-400'}`}>
            <Menu size={20} />
            <span className="text-[9px]">Tools</span>
          </button>
          <button onClick={() => { setMobileColorSheet(s => !s); setMobileToolSheet(false); setMobileGlyphSheet(false); haptic(); }} className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-colors ${mobileColorSheet ? 'text-teal-400 bg-teal-600/10' : 'text-zinc-400'}`}>
            <div className="flex gap-0.5">
              <div className="w-3.5 h-3.5 rounded-sm border border-zinc-600" style={{ backgroundColor: fg }} />
              <div className="w-3.5 h-3.5 rounded-sm border border-zinc-600" style={{ backgroundColor: bg === 'transparent' ? '#0a0a0a' : bg }} />
            </div>
            <span className="text-[9px]">Colors</span>
          </button>
          <button onClick={() => { setFill(f => !f); haptic(); }} className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-colors ${fill ? 'text-teal-400 bg-teal-600/10' : 'text-zinc-400'}`}>
            <Square size={20} fill={fill ? 'currentColor' : 'none'} />
            <span className="text-[9px]">Fill</span>
          </button>
          <button onClick={() => { setMobileGlyphSheet(s => !s); setMobileToolSheet(false); setMobileColorSheet(false); haptic(); }} className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-colors ${mobileGlyphSheet ? 'text-teal-400 bg-teal-600/10' : 'text-zinc-400'}`}>
            <Grid3X3 size={20} />
            <span className="text-[9px]">Glyphs</span>
          </button>
          <div className="flex gap-1">
            <button onClick={() => { undo(); haptic(); }} disabled={historyIndex <= 0} className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"><Undo size={18} /></button>
            <button onClick={() => { redo(); haptic(); }} disabled={historyIndex >= history.length - 1} className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"><Redo size={18} /></button>
          </div>
          <button onClick={() => { closeMobileAll(); haptic(); }} className="p-1.5 text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ===== MOBILE TOOL SHEET ===== */}
      {mobileToolSheet && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMobileToolSheet(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/98 backdrop-blur-xl border-t border-zinc-800 rounded-t-2xl" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-4" />
            <div className="grid grid-cols-4 gap-3 px-6 pb-4">
              {[
                { icon: <Pencil size={22} />, tool: 'pencil' as Tool, label: 'Pencil' },
                { icon: <Paintbrush size={22} />, tool: 'paint' as Tool, label: 'Paint' },
                { icon: <PaintRoller size={22} />, tool: 'paint-line' as Tool, label: 'Paint Line' },
                { icon: <Minus size={22} />, tool: 'line' as Tool, label: 'Line' },
                { icon: <Square size={22} />, tool: 'rect' as Tool, label: 'Rectangle' },
                { icon: <LayoutTemplate size={22} />, tool: 'smart-rect' as Tool, label: 'Smart Box' },
                { icon: <Type size={22} />, tool: 'text' as Tool, label: 'Text' },
                { icon: <Eraser size={22} />, tool: 'eraser' as Tool, label: 'Eraser' },
                { icon: <ImageIcon size={22} />, tool: 'image-box' as Tool, label: 'Image' },
              ].map(t => (
                <button
                  key={t.tool}
                  onClick={() => { setTool(t.tool); setMobileToolSheet(false); haptic(); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${tool === t.tool ? 'bg-teal-600/20 text-teal-400 ring-1 ring-teal-500/50' : 'text-zinc-400 hover:bg-zinc-800'}`}
                >
                  {t.icon}
                  <span className="text-[10px]">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-zinc-800 mx-6 pt-3 pb-2 flex gap-3">
              <button onClick={() => { clearCanvas(); setMobileToolSheet(false); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm"><Trash2 size={16} /> Clear</button>
              <button onClick={() => { exportAnsi(); setMobileToolSheet(false); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm"><Download size={16} /> Export</button>
              <button onClick={() => { ansiInputRef.current?.click(); setMobileToolSheet(false); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm"><FolderOpen size={16} /> Import</button>
              <button onClick={() => { setLibraryOpen(true); setMobileToolSheet(false); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm"><LayoutTemplate size={16} /> Library</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE COLOR SHEET ===== */}
      {mobileColorSheet && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMobileColorSheet(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/98 backdrop-blur-xl border-t border-zinc-800 rounded-t-2xl" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-4" />
            <div className="px-6 pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-400">Foreground</label>
                <input type="color" value={fg} onChange={e => setFg(e.target.value)} className="w-10 h-10 bg-zinc-800 border border-zinc-700 cursor-pointer rounded-lg" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-400">Background</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setBg('transparent')} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${bg === 'transparent' ? 'bg-teal-600 border-teal-500 text-zinc-100' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>Clear</button>
                  <input type="color" value={bg === 'transparent' ? '#000000' : bg} onChange={e => setBg(e.target.value)} className="w-10 h-10 bg-zinc-800 border border-zinc-700 cursor-pointer rounded-lg" />
                </div>
              </div>
              {savedColors.length > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Saved Colors</div>
                  <div className="flex flex-wrap gap-2">
                    {savedColors.map(c => (
                      <button key={c} onClick={() => { setFg(c); haptic(); }} className="w-8 h-8 rounded-lg border border-zinc-700 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => { setSavedColors(prev => [...new Set([...prev, fg])]); haptic(); }} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm flex items-center justify-center gap-2"><BookmarkPlus size={16} /> Save Current Color</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE GLYPH SHEET ===== */}
      {mobileGlyphSheet && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMobileGlyphSheet(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/98 backdrop-blur-xl border-t border-zinc-800 rounded-t-2xl" style={{ height: '85vh', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mt-3 mb-3" />
            <div className="flex flex-col h-full px-4 pb-4">
              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-3 shrink-0" style={{ scrollbarWidth: 'none' }}>
                {Object.keys(GLYPH_CATEGORIES).map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setGlyphCategory(cat); haptic(); }}
                    className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${glyphCategory === cat ? 'bg-teal-600 text-zinc-100' : 'bg-zinc-800 text-zinc-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Box weight sub-pills */}
              {glyphCategory === 'Box Drawing' && (
                <div className="flex gap-1.5 pb-3 shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {Object.keys(GLYPH_CATEGORIES['Box Drawing']).map(weight => (
                    <button
                      key={weight}
                      onClick={() => { setBoxWeight(weight); haptic(); }}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors ${boxWeight === weight ? 'bg-teal-600 text-zinc-100' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      {weight}
                    </button>
                  ))}
                </div>
              )}
              {/* Favorite glyphs */}
              {savedGlyphs.length > 0 && (
                <div className="pb-3 shrink-0">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Favorites</div>
                  <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {savedGlyphs.map(g => (
                      <button key={g} onClick={() => { setChar(g); setMobileGlyphSheet(false); haptic(); }} className={`w-10 h-10 flex items-center justify-center font-mono text-lg rounded-lg border transition-colors shrink-0 ${char === g ? 'bg-teal-600/20 text-teal-400 border-teal-500' : 'border-zinc-700 bg-zinc-800 text-zinc-300'}`}>{g}</button>
                    ))}
                  </div>
                </div>
              )}
              {/* Glyph grid */}
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
                <div className="grid grid-cols-8 gap-1">
                  {(glyphCategory === 'Box Drawing'
                    ? (GLYPH_CATEGORIES['Box Drawing'] as Record<string, string[]>)[boxWeight]
                    : GLYPH_CATEGORIES[glyphCategory] as string[]
                  ).map(g => (
                    <button
                      key={g}
                      onClick={() => { setChar(g); setMobileGlyphSheet(false); haptic(); }}
                      className={`w-full aspect-square flex items-center justify-center font-mono text-lg rounded-lg transition-colors ${char === g ? 'bg-teal-600/20 text-teal-400 ring-1 ring-teal-500' : 'text-zinc-300 hover:bg-zinc-800'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              {/* Save glyph button */}
              <button onClick={() => { setSavedGlyphs(prev => [...new Set([...prev, char])]); haptic(); }} className="mt-3 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm flex items-center justify-center gap-2 shrink-0"><BookmarkPlus size={16} /> Save "{char}" to Favorites</button>
            </div>
          </div>
        </div>
      )}

      {libraryOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl font-semibold text-white">Library & Templates</h2>
              <button onClick={() => setLibraryOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">My Saved Designs</h3>
                  {savePromptOpen ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={saveName} 
                        onChange={e => setSaveName(e.target.value)} 
                        placeholder="Design Name..." 
                        className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-500 w-32"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && saveToLibrary()}
                      />
                      <button onClick={saveToLibrary} className="px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs rounded">Save</button>
                      <button onClick={() => setSavePromptOpen(false)} className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded">Cancel</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSavePromptOpen(true)}
                      className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded transition-colors"
                    >
                      Save Current Canvas
                    </button>
                  )}
                </div>
                {savedDesigns.length === 0 ? (
                  <div className="text-zinc-500 text-sm italic p-4 border border-zinc-800 border-dashed rounded-lg text-center">
                    No saved designs yet. Save your current canvas to reuse it later!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {savedDesigns.map(design => (
                      <div key={design.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-zinc-200 font-medium truncate pr-2">{design.name}</span>
                          {confirmDeleteId === design.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => deleteFromLibrary(design.id)} className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-1.5 py-0.5 rounded">Yes</button>
                              <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] bg-zinc-700 hover:bg-zinc-600 text-white px-1.5 py-0.5 rounded">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(design.id)} className="text-zinc-500 hover:text-red-400 shrink-0">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 mb-3">{design.cols} × {design.rows}</div>
                        <button 
                          onClick={() => loadFromLibrary(design)}
                          className="mt-auto w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition-colors"
                        >
                          Load Design
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Premade Templates</h3>
                <div className="grid grid-cols-2 gap-3">
                  {PREMADE_TEMPLATES.map(template => (
                    <div key={template.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col">
                      <span className="text-zinc-200 font-medium mb-1">{template.name}</span>
                      <div className="text-xs text-zinc-500 mb-3">{template.cols} × {template.rows}</div>
                      <button 
                        onClick={() => loadFromLibrary({ cols: template.cols, rows: template.rows, grid: template.getGrid() })}
                        className="mt-auto w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition-colors"
                      >
                        Load Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmClear && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-2">Clear Canvas?</h2>
            <p className="text-zinc-400 text-sm mb-6">This will erase your entire drawing. This action can be undone, but it's better to be sure.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmClear(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors">Cancel</button>
              <button onClick={executeClearCanvas} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors">Yes, Clear</button>
            </div>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Import Image</h2>
            
            {importImageSrc && (
              <div className="mb-6 bg-black rounded-lg p-2 border border-zinc-800 flex justify-center">
                <img src={importImageSrc} alt="Preview" className="max-h-48 object-contain" />
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Conversion Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setImportMode('half-block')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${importMode === 'half-block' ? 'bg-teal-600 text-zinc-100' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                  >
                    Half-Blocks (Color)
                  </button>
                  <button
                    onClick={() => setImportMode('braille')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${importMode === 'braille' ? 'bg-teal-600 text-zinc-100' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                  >
                    Braille (Shapes)
                  </button>
                </div>
              </div>

              {importMode === 'braille' && (
                <div className="space-y-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-zinc-400">Brightness Threshold</label>
                      <span className="text-xs text-zinc-500">{importThreshold}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="255" 
                      value={importThreshold} 
                      onChange={e => setImportThreshold(parseInt(e.target.value))}
                      className="w-full accent-teal-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300 hover:text-zinc-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={importInvert} 
                      onChange={e => setImportInvert(e.target.checked)} 
                      className="rounded border-zinc-700 bg-zinc-800 text-teal-400 focus:ring-teal-400" 
                    />
                    Invert Brightness (Draw dark areas)
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={processImport}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-zinc-100 hover:bg-teal-500 transition-colors shadow-md"
              >
                Import to Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setHelpOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()} style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Help & Shortcuts</h2>
              <button onClick={() => setHelpOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">Drawing Tools</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-300"><span>✏️ Pencil</span><span className="text-zinc-500">Freehand draw with selected glyph</span></div>
                  <div className="flex justify-between text-zinc-300"><span>🖌️ Paint</span><span className="text-zinc-500">Recolor — keeps existing character</span></div>
                  <div className="flex justify-between text-zinc-300"><span>🖌️ Paint Line</span><span className="text-zinc-500">Recolor along a line</span></div>
                  <div className="flex justify-between text-zinc-300"><span>➖ Line</span><span className="text-zinc-500">Hold Shift to snap angles</span></div>
                  <div className="flex justify-between text-zinc-300"><span>⬜ Rectangle</span><span className="text-zinc-500">Shift: Square · Ctrl: From center</span></div>
                  <div className="flex justify-between text-zinc-300"><span>📐 Smart Box</span><span className="text-zinc-500">Auto box-drawing characters</span></div>
                  <div className="flex justify-between text-zinc-300"><span>📝 Text</span><span className="text-zinc-500">Click and type · Enter for new line</span></div>
                  <div className="flex justify-between text-zinc-300"><span>🧹 Eraser</span><span className="text-zinc-500">Erase to blank</span></div>
                  <div className="flex justify-between text-zinc-300"><span>🖼️ Image Import</span><span className="text-zinc-500">Draw a box, then pick an image</span></div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">Keyboard Shortcuts</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-300"><span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-xs">⌘/Ctrl + Z</span><span className="text-zinc-500">Undo</span></div>
                  <div className="flex justify-between text-zinc-300"><span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-xs">⌘/Ctrl + Shift + Z</span><span className="text-zinc-500">Redo</span></div>
                  <div className="flex justify-between text-zinc-300"><span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-xs">⌘/Ctrl + Scroll</span><span className="text-zinc-500">Zoom in/out</span></div>
                  <div className="flex justify-between text-zinc-300"><span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-xs">?</span><span className="text-zinc-500">Toggle this help</span></div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">Workflow Tips</h3>
                <div className="space-y-2 text-sm text-zinc-400">
                  <p>• Use <strong className="text-zinc-200">Smart Box</strong> for auto-connected borders</p>
                  <p>• <strong className="text-zinc-200">Import Image</strong>: draw the target area first, then choose an image</p>
                  <p>• <strong className="text-zinc-200">Half-Block</strong> mode preserves color · <strong className="text-zinc-200">Braille</strong> mode shows detail</p>
                  <p>• <strong className="text-zinc-200">Export ANSI</strong> and paste into your AI coding agent to generate a working TUI</p>
                  <p>• Right-click saved colors/glyphs to remove them</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center">
              <a href="https://github.com/WatchmanReeves/TuiEasy" target="_blank" rel="noopener noreferrer" className="text-sm text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1.5">
                <Github size={14} /> View on GitHub
              </a>
              <span className="text-xs text-zinc-600">Press ? to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
