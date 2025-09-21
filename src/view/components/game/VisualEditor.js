import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState, // <--- agregar esto
} from "react";

import * as fabric from "fabric";

const renderFromSlideData = (canvas, data) => {
  if (!canvas || !data) return;

  if (data.type === "question") {
    const q = data.question;
    const index = data.questionIndex;

    const questionText = new fabric.Textbox(`P${index + 1}: ${q.question_text}`, {
      left: 270,
      top: 100,
      width: 1150,
      height: 100,
      fontSize: 34,
      fill: "#000000",
      textAlign: "center",
      originY: "center",
      editable: true,
      selectable: true,
      hasControls: true,
    });

    questionText.id = `obj_${Date.now()}_${Math.random()}`;
    canvas.add(questionText);

    const answerPositions = [
      { left: 110, top: 600 },
      { left: 950, top: 600 },
      { left: 110, top: 700 },
      { left: 950, top: 700 },
    ];

    q.answers.forEach((ans, ansIndex) => {
      if (ansIndex >= answerPositions.length) return;
      const pos = answerPositions[ansIndex];

      const answerRect = new fabric.Rect({
        width: 650,
        height: 70,
        fill: ans.is_correct ? "#28a745" : "#007bff",
        rx: 12,
        ry: 12,
        shadow: new fabric.Shadow({
          color: "rgba(0,0,0,0.2)",
          blur: 8,
          offsetX: 3,
          offsetY: 3,
        }),
        selectable: false,
        evented: false,
      });

      const answerText = new fabric.Textbox(ans.answer_text, {
        width: 320,
        fontSize: 22,
        fill: "white",
        textAlign: "center",
        originX: "center",
        originY: "center",
      });

      const answerGroup = new fabric.Group(
        [answerRect, answerText.set({ left: 310, top: 35 })],
        {
          left: pos.left,
          top: pos.top,
          selectable: true,
          hasControls: true,
        }
      );

      answerGroup.id = `obj_${Date.now()}_${Math.random()}`;
      canvas.add(answerGroup);
    });
  }

  canvas.off && canvas.off("mouse:dblclick");
  canvas.on("mouse:dblclick", (e) => {
    const target = e.target;
    if (target && target.type === "group") {
      target.forEachObject((obj) => {
        if (obj.type === "textbox") {
          obj.enterEditing();
          obj.selectAll && obj.selectAll();
        }
      });
    }
  });

  canvas.renderAll();
};

const VisualEditor = forwardRef(
  (
    {
      slideData,
      initialCanvasState,
      onObjectSelected,
      onCanvasChange,
      onUpdateElement,
      onDeleteElement,
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);

    const debounceTimeoutRef = useRef(null);
    const isUpdatingRef = useRef(false);
    const isUpdatingCanvas = useRef(false);
    const lastGoodStateRef = useRef(null);

    const getSerializableObjects = useCallback(() => {
      if (!fabricCanvasRef.current) return [];
      const canvas = fabricCanvasRef.current;
      return canvas
        .getObjects()
        .filter((obj) => obj)
        .map((obj) => obj.toJSON());
    }, []);

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

// ---- en VisualEditor ----

// Debounce limpio: solo notifica al padre el listado serializado
const debouncedOnCanvasChange = useCallback(() => {
  if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

  debounceTimeoutRef.current = setTimeout(() => {
    if (isUpdatingRef.current) return;
    onCanvasChange(getSerializableObjects());
  }, 500);
}, [onCanvasChange, getSerializableObjects]);

// Exponer API al padre a través del ref
useImperativeHandle(ref, () => ({
  // devuelve el estado serializable actual (Array)
  getCanvasState: () => getSerializableObjects(),

  // restaura el canvas desde un estado serializado (Array)
  restoreCanvasState: (state) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !state) return;
    isUpdatingRef.current = true;
    canvas.clear();
    fabric.util.enlivenObjects(state, (enlivenedObjects) => {
      enlivenedObjects.forEach((obj) => obj && canvas.add(obj));
      canvas.renderAll();
      lastGoodStateRef.current = state;
      isUpdatingRef.current = false;
    });
  },

  // opcional: si quieres acceso directo al fabric.Canvas (no necesario)
  getFabricCanvas: () => fabricCanvasRef.current,
}));


    useEffect(() => {
      const domCanvas = canvasRef.current;
      if (!domCanvas || !domCanvas.parentElement) return;
      if (fabricCanvasRef.current) return;

      const canvas = new fabric.Canvas(domCanvas, {
        width: domCanvas.parentElement.offsetWidth,
        height: domCanvas.parentElement.offsetHeight,
        backgroundColor: "#f8f9fa",
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = canvas;

      const handleSelection = (e) => {
        if (e && e.selected && e.selected.length > 0) {
          onObjectSelected(e.selected[0]);
        } else {
          onObjectSelected(null);
        }
      };

      canvas.on("selection:created", handleSelection);
      canvas.on("selection:updated", handleSelection);
      canvas.on("selection:cleared", () => onObjectSelected(null));

      canvas.on("object:modified", (e) => {
        if (isUpdatingRef.current) return;
        debouncedOnCanvasChange();
      });

      // Inicializar contenido
      if (initialCanvasState && initialCanvasState.length > 0) {
        isUpdatingRef.current = true;
        fabric.util.enlivenObjects(initialCanvasState, (enlivenedObjects) => {
          enlivenedObjects.forEach((obj) => obj && canvas.add(obj));
          canvas.renderAll();
          lastGoodStateRef.current = initialCanvasState;
          isUpdatingRef.current = false;
        });
      } else if (slideData) {
        renderFromSlideData(canvas, slideData);
        lastGoodStateRef.current = getSerializableObjects();
      }

      return () => {
        if (canvas) {
          canvas.off && canvas.off();
          canvas.dispose && canvas.dispose();
        }
        fabricCanvasRef.current = null;
      };
    }, []);

    useEffect(() => {
      const fabricCanvas = fabricCanvasRef.current;
      if (!fabricCanvas) return;

      if (isUpdatingCanvas.current) return;
      isUpdatingCanvas.current = true;

      try {
        if (initialCanvasState && initialCanvasState.length > 0) {
          
          fabric.util.enlivenObjects(initialCanvasState, (enlivenedObjects) => {
            enlivenedObjects.forEach((obj) => fabricCanvas.add(obj));
            fabricCanvas.renderAll();
            lastGoodStateRef.current = initialCanvasState;
            isUpdatingCanvas.current = false;
          });
        } else if (slideData && fabricCanvas.getObjects().length === 0) {
          renderFromSlideData(fabricCanvas, slideData);
          lastGoodStateRef.current = getSerializableObjects();
          isUpdatingCanvas.current = false;
        } else if (!initialCanvasState || initialCanvasState.length === 0) {
          // 🚫 No borres si llega vacío → conserva el último bueno
          console.log("Manteniendo último estado válido");
          isUpdatingCanvas.current = false;
        }
      } catch (err) {
        console.error("Error cargando canvas:", err);
        isUpdatingCanvas.current = false;
      }
    }, [initialCanvasState, slideData]);

    return (
      <div className="w-full h-full relative">
        <canvas ref={canvasRef} />
      </div>
    );
  }
);

export default VisualEditor;
