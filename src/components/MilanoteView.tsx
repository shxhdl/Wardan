import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import {
  FileText,
  ImagePlus,
  CheckSquare,
  Palette,
  Link2,
  Plus,
  Trash2,
  GripHorizontal,
  FolderPlus,
  LayoutGrid,
  Move,
  ExternalLink,
  X,
  Check,
} from 'lucide-react';

export type MilanoteCardType = 'note' | 'image' | 'todo' | 'color' | 'link';

export interface MilanoteTodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface MilanoteCard {
  id: string;
  type: MilanoteCardType;
  title: string;
  content?: string;
  imageUrl?: string;
  todos?: MilanoteTodoItem[];
  colorHex?: string;
  linkUrl?: string;
  accentColor: string;
  x: number;
  y: number;
  width: number;
}

export interface MilanoteBoard {
  id: string;
  nameAr: string;
  nameEn: string;
  cards: MilanoteCard[];
}

const STORAGE_KEY = 'wardan_v3_milanote_boards';

const CARD_ACCENTS = [
  '#FAF8F4',
  '#F4EAE6',
  '#EFECE5',
  '#E7EFE6',
  '#F5EEDB',
  '#EAE6F0',
];

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 720;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const DEFAULT_BOARDS: MilanoteBoard[] = [
  {
    id: 'board-main',
    nameAr: 'لوحة أفكار وتنسيقات وردان',
    nameEn: 'WARDAN Moodboard & Ideas',
    cards: [],
  },
];

interface MilanoteViewProps {
  lang: Language;
}

export const MilanoteView: React.FC<MilanoteViewProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [boards, setBoards] = useState<MilanoteBoard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as MilanoteBoard[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_BOARDS;
  });

  const [activeBoardId, setActiveBoardId] = useState<string>(() => {
    return boards[0]?.id || 'board-main';
  });

  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');
  const [newBoardModal, setNewBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  // Dragging state for freeform canvas
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({
    offsetX: 0,
    offsetY: 0,
  });
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
    } catch {
      // ignore storage quota errors
    }
  }, [boards]);

  const activeBoard =
    boards.find((b) => b.id === activeBoardId) || boards[0] || DEFAULT_BOARDS[0];

  const updateActiveBoardCards = (
    updater: (cards: MilanoteCard[]) => MilanoteCard[]
  ) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id === activeBoard.id ? { ...b, cards: updater(b.cards) } : b
      )
    );
  };

  const getNextCardPosition = (index: number) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
      x: 32 + col * 310,
      y: 32 + row * 260,
    };
  };

  const handleAddCard = (type: MilanoteCardType) => {
    if (type === 'image') {
      fileInputRef.current?.click();
      return;
    }

    const pos = getNextCardPosition(activeBoard.cards.length);
    const id = `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    let newCard: MilanoteCard = {
      id,
      type,
      title: '',
      accentColor: '#FAF8F4',
      x: pos.x,
      y: pos.y,
      width: 285,
    };

    if (type === 'note') {
      newCard = {
        ...newCard,
        title: isAr ? 'ملاحظة جديدة' : 'New Note',
        content: '',
      };
    } else if (type === 'todo') {
      newCard = {
        ...newCard,
        title: isAr ? 'قائمة مهام' : 'To-Do List',
        todos: [{ id: `todo-${Date.now()}`, text: '', done: false }],
      };
    } else if (type === 'color') {
      newCard = {
        ...newCard,
        title: isAr ? 'درجة لون التنسيق' : 'Floral Color Swatch',
        colorHex: '#4A5035',
      };
    } else if (type === 'link') {
      newCard = {
        ...newCard,
        title: isAr ? 'رابط مرجعي' : 'Reference Link',
        linkUrl: '',
        content: '',
      };
    }

    updateActiveBoardCards((cards) => [...cards, newCard]);
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newCards: MilanoteCard[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const dataUrl = await compressImageFile(files[i]);
        const pos = getNextCardPosition(activeBoard.cards.length + i);
        newCards.push({
          id: `card-img-${Date.now()}-${i}`,
          type: 'image',
          title: '',
          imageUrl: dataUrl,
          accentColor: '#FAF8F4',
          x: pos.x,
          y: pos.y,
          width: 285,
        });
      } catch {
        // ignore failed file
      }
    }

    if (newCards.length > 0) {
      updateActiveBoardCards((cards) => [...cards, ...newCards]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateCard = (
    cardId: string,
    patch: Partial<MilanoteCard>
  ) => {
    updateActiveBoardCards((cards) =>
      cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c))
    );
  };

  const handleDeleteCard = (cardId: string) => {
    updateActiveBoardCards((cards) => cards.filter((c) => c.id !== cardId));
  };

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBoardName.trim();
    if (!clean) return;
    const newBoard: MilanoteBoard = {
      id: `board-${Date.now()}`,
      nameAr: clean,
      nameEn: clean,
      cards: [],
    };
    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
    setNewBoardName('');
    setNewBoardModal(false);
  };

  const handleDeleteBoard = (boardId: string) => {
    if (boards.length <= 1) return;
    const remaining = boards.filter((b) => b.id !== boardId);
    setBoards(remaining);
    if (activeBoard.id === boardId) {
      setActiveBoardId(remaining[0].id);
    }
  };

  // Pointer Drag Handlers for Freeform Canvas
  const handlePointerDownCard = (
    e: React.PointerEvent,
    card: MilanoteCard
  ) => {
    if (viewMode !== 'canvas') return;
    if (!canvasRef.current) return;
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      offsetX: e.clientX - rect.left - card.x,
      offsetY: e.clientY - rect.top - card.y,
    };
    setDraggingCardId(card.id);
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    if (!draggingCardId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const nextX = Math.max(
      12,
      Math.min(
        rect.width - 295,
        Math.round(e.clientX - rect.left - dragOffsetRef.current.offsetX)
      )
    );
    const nextY = Math.max(
      12,
      Math.round(e.clientY - rect.top - dragOffsetRef.current.offsetY)
    );
    handleUpdateCard(draggingCardId, { x: nextX, y: nextY });
  };

  const handlePointerUpCanvas = () => {
    if (draggingCardId) {
      setDraggingCardId(null);
    }
  };

  const renderCardBody = (card: MilanoteCard) => {
    switch (card.type) {
      case 'note':
        return (
          <textarea
            rows={4}
            value={card.content || ''}
            onChange={(e) =>
              handleUpdateCard(card.id, { content: e.target.value })
            }
            placeholder={
              isAr ? 'اكتب ملاحظاتك أو أفكار التنسيق هنا...' : 'Write your notes here...'
            }
            className="w-full bg-transparent text-xs sm:text-sm text-[#2B2F21] leading-relaxed resize-y focus:outline-none placeholder:text-[#848871]/70"
          />
        );

      case 'image':
        return (
          <div className="space-y-2">
            {card.imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-[#DCD6C8] bg-white">
                <img
                  src={card.imageUrl}
                  alt={card.title || 'Moodboard'}
                  draggable={false}
                  className="w-full max-h-56 object-cover"
                />
              </div>
            )}
            <input
              type="text"
              value={card.content || ''}
              onChange={(e) =>
                handleUpdateCard(card.id, { content: e.target.value })
              }
              placeholder={
                isAr ? 'وصف الصورة أو ملاحظة...' : 'Image caption or note...'
              }
              className="w-full bg-transparent text-xs text-[#5A5E4D] focus:outline-none"
            />
          </div>
        );

      case 'todo': {
        const todos = card.todos || [];
        return (
          <div className="space-y-2">
            {todos.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => {
                    const updated = todos.map((t) =>
                      t.id === item.id ? { ...t, done: !t.done } : t
                    );
                    handleUpdateCard(card.id, { todos: updated });
                  }}
                  className="w-4 h-4 rounded accent-[#4A5035] cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const updated = todos.map((t) =>
                      t.id === item.id ? { ...t, text: e.target.value } : t
                    );
                    handleUpdateCard(card.id, { todos: updated });
                  }}
                  placeholder={isAr ? 'مهمة جديدة...' : 'Task item...'}
                  className={`flex-1 bg-transparent text-xs focus:outline-none ${
                    item.done
                      ? 'line-through text-[#848871]'
                      : 'text-[#2B2F21] font-medium'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = todos.filter((t) => t.id !== item.id);
                    handleUpdateCard(card.id, { todos: updated });
                  }}
                  className="text-[#848871] hover:text-[#A8382B] p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                const next: MilanoteTodoItem = {
                  id: `todo-${Date.now()}`,
                  text: '',
                  done: false,
                };
                handleUpdateCard(card.id, { todos: [...todos, next] });
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A5035] hover:underline pt-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة مهمة' : 'Add task'}</span>
            </button>
          </div>
        );
      }

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <label className="relative w-14 h-14 rounded-2xl overflow-hidden border border-[#DCD6C8] shadow-xs cursor-pointer shrink-0">
              <input
                type="color"
                value={card.colorHex || '#4A5035'}
                onChange={(e) =>
                  handleUpdateCard(card.id, { colorHex: e.target.value })
                }
                className="absolute inset-0 w-20 h-20 -top-2 -left-2 cursor-pointer"
              />
            </label>
            <div className="flex-1 space-y-1">
              <input
                type="text"
                dir="ltr"
                value={card.colorHex || '#4A5035'}
                onChange={(e) =>
                  handleUpdateCard(card.id, { colorHex: e.target.value })
                }
                className="w-full px-2.5 py-1 rounded-lg bg-white/80 border border-[#DCD6C8] text-xs font-mono font-bold text-[#2B2F21]"
              />
              <p className="text-[11px] text-[#6E7162]">
                {isAr
                  ? 'اضغط على المربع لاختيار درجة اللون'
                  : 'Tap swatch to pick a color'}
              </p>
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="space-y-2">
            <input
              type="url"
              dir="ltr"
              value={card.linkUrl || ''}
              onChange={(e) =>
                handleUpdateCard(card.id, { linkUrl: e.target.value })
              }
              placeholder="https://..."
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/80 border border-[#DCD6C8] text-xs font-mono text-[#2B2F21] focus:outline-none"
            />
            {card.linkUrl && (
              <a
                href={card.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#4A5035] hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isAr ? 'فتح الرابط' : 'Open Link'}</span>
              </a>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden Album File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUploadImages}
        className="hidden"
      />

      {/* Top Header & Board Switcher */}
      <div className="bg-[#FAF8F4] rounded-2xl p-4 sm:p-5 border border-[#E6E1D6] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#4A5035] text-[#D5B895] text-[11px] font-bold">
              Milanote
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#2B2F21]">
              {isAr
                ? 'لوحة الأفكار والتنسيقات البصرية (Milanote)'
                : 'Milanote Visual Moodboard & Notes'}
            </h1>
          </div>
          <p className="text-xs text-[#6E7162] mt-1">
            {isAr
              ? 'مساحة حرة لجمع صور التنسيقات، الملاحظات، قوائم المهام، وألوان المناسبات مع إمكانية السحب والترتيب'
              : 'Freeform visual workspace for floral inspiration photos, notes, checklists, and color palettes'}
          </p>
        </div>

        {/* Board Tabs + View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {boards.map((b) => {
            const isCurrent = b.id === activeBoard.id;
            return (
              <div
                key={b.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  isCurrent
                    ? 'bg-[#4A5035] text-[#FAF8F4] border-[#4A5035]'
                    : 'bg-[#EFECE5] text-[#2B2F21] border-[#DCD6C8] hover:bg-[#E4DFD3]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveBoardId(b.id)}
                  className="cursor-pointer"
                >
                  {isAr ? b.nameAr : b.nameEn}
                </button>
                {boards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBoard(b.id)}
                    title={isAr ? 'حذف اللوحة' : 'Delete Board'}
                    className="opacity-75 hover:opacity-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setNewBoardModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EFECE5] hover:bg-[#E2DDD2] border border-[#DCD6C8] text-[#4A5035] text-xs font-bold cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{isAr ? '+ لوحة جديدة' : '+ New Board'}</span>
          </button>

          <div className="h-5 w-px bg-[#DCD6C8] mx-1 hidden sm:block" />

          <div className="inline-flex rounded-xl bg-[#EFECE5] p-1 border border-[#DCD6C8]">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-[#4A5035] text-[#FAF8F4]'
                  : 'text-[#5A5E4D]'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>{isAr ? 'لوحة حرة' : 'Canvas'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#4A5035] text-[#FAF8F4]'
                  : 'text-[#5A5E4D]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isAr ? 'شبكة' : 'Grid'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Board Creation Inline Bar */}
      {newBoardModal && (
        <form
          onSubmit={handleCreateBoard}
          className="bg-[#FAF8F4] rounded-2xl p-4 border border-[#D5B895] flex flex-wrap items-center gap-2 text-xs"
        >
          <input
            type="text"
            required
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder={isAr ? 'اسم اللوحة الجديدة...' : 'New board name...'}
            className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl bg-[#EFECE5] border border-[#DCD6C8] text-[#2B2F21] font-bold focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#4A5035] text-[#FAF8F4] font-bold cursor-pointer inline-flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isAr ? 'إنشاء' : 'Create'}</span>
          </button>
          <button
            type="button"
            onClick={() => setNewBoardModal(false)}
            className="px-3 py-2 rounded-xl bg-[#EFECE5] text-[#5A5E4D] font-bold cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </form>
      )}

      {/* Main Workspace: Tool Dock + Visual Board */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Milanote Tool Dock */}
        <div className="w-full lg:w-44 bg-[#FAF8F4] rounded-2xl p-3 border border-[#E6E1D6] shadow-2xs flex lg:flex-col gap-2 overflow-x-auto shrink-0">
          <div className="hidden lg:block text-[11px] font-bold text-[#6E7162] px-2 pb-1 border-b border-[#EAE5DA]">
            {isAr ? 'أدوات الإضافة' : 'Add to Board'}
          </div>

          <button
            type="button"
            onClick={() => handleAddCard('note')}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#EFECE5]/80 hover:bg-[#4A5035] hover:text-[#FAF8F4] text-[#2B2F21] text-xs font-bold transition cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4 text-[#9A7B56] shrink-0" />
            <span>{isAr ? 'ملاحظة' : 'Note'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddCard('image')}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#EFECE5]/80 hover:bg-[#4A5035] hover:text-[#FAF8F4] text-[#2B2F21] text-xs font-bold transition cursor-pointer shrink-0"
          >
            <ImagePlus className="w-4 h-4 text-[#9A7B56] shrink-0" />
            <span>{isAr ? 'صورة من الألبوم' : 'Photo'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddCard('todo')}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#EFECE5]/80 hover:bg-[#4A5035] hover:text-[#FAF8F4] text-[#2B2F21] text-xs font-bold transition cursor-pointer shrink-0"
          >
            <CheckSquare className="w-4 h-4 text-[#9A7B56] shrink-0" />
            <span>{isAr ? 'قائمة مهام' : 'To-Do List'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddCard('color')}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#EFECE5]/80 hover:bg-[#4A5035] hover:text-[#FAF8F4] text-[#2B2F21] text-xs font-bold transition cursor-pointer shrink-0"
          >
            <Palette className="w-4 h-4 text-[#9A7B56] shrink-0" />
            <span>{isAr ? 'درجة لون' : 'Color Swatch'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddCard('link')}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#EFECE5]/80 hover:bg-[#4A5035] hover:text-[#FAF8F4] text-[#2B2F21] text-xs font-bold transition cursor-pointer shrink-0"
          >
            <Link2 className="w-4 h-4 text-[#9A7B56] shrink-0" />
            <span>{isAr ? 'رابط' : 'Link'}</span>
          </button>
        </div>

        {/* Visual Board Canvas */}
        <div
          ref={canvasRef}
          onPointerMove={handlePointerMoveCanvas}
          onPointerUp={handlePointerUpCanvas}
          onPointerLeave={handlePointerUpCanvas}
          style={{
            backgroundImage:
              'radial-gradient(#C8C1B2 1.25px, transparent 1.25px)',
            backgroundSize: '22px 22px',
          }}
          className="flex-1 w-full min-h-[620px] rounded-3xl bg-[#EFECE5]/65 border border-[#DFD9CC] p-4 sm:p-6 relative overflow-auto shadow-inner"
        >
          {activeBoard.cards.length === 0 ? (
            <div className="h-[520px] flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-[#4A5035]/10 text-[#4A5035] flex items-center justify-center mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#2B2F21]">
                {isAr
                  ? 'لوحة Milanote فارغة حالياً'
                  : 'Your Milanote board is empty'}
              </h3>
              <p className="text-xs text-[#6E7162] max-w-sm mt-1">
                {isAr
                  ? 'اضغط على أي أداة من القائمة (ملاحظة، صورة من الألبوم، قائمة مهام، أو درجة لون) لإضافتها إلى اللوحة وتحريكها بحرية.'
                  : 'Click any tool on the side (Note, Photo, To-Do List, or Color) to add cards and drag them freely across the board.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeBoard.cards.map((card) => (
                <div
                  key={card.id}
                  style={{ backgroundColor: card.accentColor || '#FAF8F4' }}
                  className="rounded-2xl p-4 border border-[#DCD6C8] shadow-sm space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/8">
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) =>
                        handleUpdateCard(card.id, { title: e.target.value })
                      }
                      placeholder={isAr ? 'عنوان البطاقة...' : 'Card title...'}
                      className="font-extrabold text-xs sm:text-sm text-[#2B2F21] bg-transparent focus:outline-none flex-1"
                    />
                    <div className="flex items-center gap-1">
                      {CARD_ACCENTS.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() =>
                            handleUpdateCard(card.id, { accentColor: hex })
                          }
                          style={{ backgroundColor: hex }}
                          className="w-3.5 h-3.5 rounded-full border border-black/20 cursor-pointer"
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id)}
                        title={isAr ? 'حذف البطاقة' : 'Delete card'}
                        className="p-1 rounded-lg text-[#A8382B] hover:bg-[#A8382B]/10 cursor-pointer ms-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {renderCardBody(card)}
                </div>
              ))}
            </div>
          ) : (
            <div className="relative min-w-[880px] min-h-[580px]">
              {activeBoard.cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    left: `${card.x}px`,
                    top: `${card.y}px`,
                    width: `${card.width || 285}px`,
                    backgroundColor: card.accentColor || '#FAF8F4',
                  }}
                  className={`absolute rounded-2xl p-4 border shadow-md space-y-3 transition-shadow ${
                    draggingCardId === card.id
                      ? 'z-30 shadow-2xl border-[#4A5035] ring-2 ring-[#4A5035]/20'
                      : 'z-10 border-[#DCD6C8]'
                  }`}
                >
                  {/* Drag Handle + Title + Delete */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/8">
                    <div
                      onPointerDown={(e) => handlePointerDownCard(e, card)}
                      title={isAr ? 'اسحب لتحريك البطاقة' : 'Drag to move card'}
                      className="p-1 -ms-1 rounded-lg text-[#848871] hover:text-[#2B2F21] hover:bg-black/5 cursor-grab active:cursor-grabbing touch-none"
                    >
                      <GripHorizontal className="w-4 h-4" />
                    </div>

                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) =>
                        handleUpdateCard(card.id, { title: e.target.value })
                      }
                      placeholder={isAr ? 'عنوان البطاقة...' : 'Card title...'}
                      className="font-extrabold text-xs sm:text-sm text-[#2B2F21] bg-transparent focus:outline-none flex-1 min-w-0"
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      {CARD_ACCENTS.slice(0, 4).map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() =>
                            handleUpdateCard(card.id, { accentColor: hex })
                          }
                          style={{ backgroundColor: hex }}
                          className="w-3 h-3 rounded-full border border-black/20 cursor-pointer"
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id)}
                        title={isAr ? 'حذف البطاقة' : 'Delete card'}
                        className="p-1 rounded-lg text-[#A8382B] hover:bg-[#A8382B]/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {renderCardBody(card)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

