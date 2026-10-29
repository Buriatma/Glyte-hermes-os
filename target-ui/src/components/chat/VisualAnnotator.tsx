"use client";

import { useRef, useState } from "react";
import {
  Square,
  MapPin,
  Trash2,
  Check,
  X,
  Undo2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface AnnotationBox {
  id: string;
  type: "box";
  x: number; // percentage 0-100
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface AnnotationPin {
  id: string;
  type: "pin";
  x: number;
  y: number;
  index: number;
  label: string;
}

export type VisualAnnotation = AnnotationBox | AnnotationPin;

interface VisualAnnotatorProps {
  imageUrl: string;
  onSave: (annotations: VisualAnnotation[], promptSnippet: string) => void;
  onCancel: () => void;
}

export function VisualAnnotator({ imageUrl, onSave, onCancel }: VisualAnnotatorProps) {
  const [mode, setMode] = useState<"box" | "pin">("box");
  const [annotations, setAnnotations] = useState<VisualAnnotation[]>([]);
  const [currentLabel, setCurrentLabel] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getRelativeCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getRelativeCoords(e);
    if (mode === "pin") {
      const pinIndex = annotations.filter((a) => a.type === "pin").length + 1;
      const newPin: AnnotationPin = {
        id: `pin_${Date.now()}`,
        type: "pin",
        x: coords.x,
        y: coords.y,
        index: pinIndex,
        label: currentLabel.trim() || `Pin #${pinIndex}`,
      };
      setAnnotations((prev) => [...prev, newPin]);
      setCurrentLabel("");
    } else {
      setIsDrawing(true);
      setStartPoint(coords);
      setCurrentBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint) return;
    const coords = getRelativeCoords(e);
    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const w = Math.abs(coords.x - startPoint.x);
    const h = Math.abs(coords.y - startPoint.y);
    setCurrentBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox && currentBox.w > 2 && currentBox.h > 2) {
      const boxIndex = annotations.filter((a) => a.type === "box").length + 1;
      const newBox: AnnotationBox = {
        id: `box_${Date.now()}`,
        type: "box",
        x: currentBox.x,
        y: currentBox.y,
        width: currentBox.w,
        height: currentBox.h,
        label: currentLabel.trim() || `Region #${boxIndex}`,
      };
      setAnnotations((prev) => [...prev, newBox]);
      setCurrentLabel("");
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentBox(null);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = () => {
    const summary = annotations
      .map((a, i) => {
        if (a.type === "box") {
          return `[Box ${i + 1}: "${a.label}" at x:${a.x.toFixed(1)}%, y:${a.y.toFixed(1)}%, w:${a.width.toFixed(1)}%, h:${a.height.toFixed(1)}%]`;
        }
        return `[Pin ${a.index}: "${a.label}" at x:${a.x.toFixed(1)}%, y:${a.y.toFixed(1)}%]`;
      })
      .join("\n");

    const promptSnippet = summary
      ? `\n\n--- Visual Context Annotations ---\n${summary}\n----------------------------------`
      : "";

    onSave(annotations, promptSnippet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-background border border-border/60 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            <span className="font-semibold text-sm">Visual Context Annotator</span>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Vision Grounding
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={mode === "box" ? "default" : "outline"}
              onClick={() => setMode("box")}
              className="h-7 text-xs gap-1.5"
            >
              <Square className="size-3.5" />
              Bounding Box
            </Button>
            <Button
              size="sm"
              variant={mode === "pin" ? "default" : "outline"}
              onClick={() => setMode("pin")}
              className="h-7 text-xs gap-1.5"
            >
              <MapPin className="size-3.5" />
              Pin Point
            </Button>
            <Button size="icon" variant="ghost" onClick={onCancel} className="size-7">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar & Label Input */}
        <div className="px-4 py-2 bg-muted/10 border-b border-border/20 flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Annotation Label:
          </span>
          <Input
            value={currentLabel}
            onChange={(e) => setCurrentLabel(e.target.value)}
            placeholder={mode === "box" ? "e.g., Error message box, Button UI" : "e.g., Click here, Broken icon"}
            className="h-7 text-xs max-w-md bg-background"
          />
          {annotations.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAnnotations((prev) => prev.slice(0, -1))}
              className="h-7 text-xs gap-1 text-muted-foreground ml-auto"
            >
              <Undo2 className="size-3.5" />
              Undo
            </Button>
          )}
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="relative select-none cursor-crosshair rounded-lg overflow-hidden border border-border/40 shadow-lg max-w-full max-h-[60vh]"
            style={{ display: "inline-block" }}
          >
            {/* Base Image */}
            <img
              src={imageUrl}
              alt="Annotate Target"
              className="max-h-[60vh] object-contain pointer-events-none"
              draggable={false}
            />

            {/* Existing Annotations */}
            {annotations.map((ann) => {
              if (ann.type === "box") {
                return (
                  <div
                    key={ann.id}
                    className="absolute border-2 border-emerald-400 bg-emerald-500/15 pointer-events-auto group cursor-pointer"
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      width: `${ann.width}%`,
                      height: `${ann.height}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAnnotation(ann.id);
                    }}
                  >
                    <span className="absolute -top-5 left-0 text-[10px] bg-emerald-500 text-black font-semibold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                      {ann.label}
                    </span>
                    <div className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-black/60 text-white text-[10px]">
                      <Trash2 className="size-3 mr-1" /> Remove
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={ann.id}
                  className="absolute pointer-events-auto group cursor-pointer"
                  style={{
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAnnotation(ann.id);
                  }}
                >
                  <div className="size-6 rounded-full bg-amber-500 text-black font-bold text-[11px] flex items-center justify-center shadow-md border-2 border-white">
                    {ann.index}
                  </div>
                  <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] bg-background/90 text-foreground border border-border px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                    {ann.label}
                  </span>
                </div>
              );
            })}

            {/* In-Progress Drawing Box */}
            {isDrawing && currentBox && (
              <div
                className="absolute border-2 border-dashed border-emerald-300 bg-emerald-500/20 pointer-events-none"
                style={{
                  left: `${currentBox.x}%`,
                  top: `${currentBox.y}%`,
                  width: `${currentBox.w}%`,
                  height: `${currentBox.h}%`,
                }}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 bg-muted/20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{annotations.length} annotations added</span>
            <span className="text-[11px] opacity-60">(Click any tag on canvas to delete)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onCancel} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              <Check className="size-3.5" />
              Attach Visual Context
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
