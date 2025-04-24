import { useDroppable } from "@dnd-kit/core";
import Box from "@mui/material/Box";
import { DraggableItem } from "./DragCard";
import Typography from "@mui/material/Typography";
import CancelIcon from "@mui/icons-material/Cancel";
import { IconButton } from "@mui/material";
export default function DropCard({ expression, setExpression }) {
  const { setNodeRef: setAreaRef } = useDroppable({
    id: "expression-drop-area",
  });

  return (
    <Box
      ref={setAreaRef}
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height:"30px",
        p: 1,
        gap: 0.5,
        alignItems: "center",
        position: "relative", // Add this
      }}
    >
      {expression.length === 0 ? (
        <Typography color="textSecondary">
          Drag and drop elements here
        </Typography>
      ) : (
        expression.map((item, index) => {
          const idPrefix =
            item.type === "selector"
              ? "expression-selector"
              : "expression-choice";
          const droppableId = `${idPrefix}-${index}`;
          return (
            <ExpressionDroppableItem
              key={droppableId}
              id={droppableId}
              label={item.label}
            />
          );
        })
      )}
      <IconButton
        onClick={() => {
          setExpression([]);
        }}
        sx={{
          position: "absolute", // Fix at the end
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <CancelIcon />
      </IconButton>
    </Box>
  );
}

// Helper component for each droppable/drag item
function ExpressionDroppableItem({ id, label }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef}>
      <DraggableItem id={id}>
        <Box
          sx={{
            width: "36px",
            height: "36px",
            border: 1,
            borderRadius: "5px",
            padding: "0.2rem",
            display: "flex", // Change to flex for centering
            alignItems: "center", // Vertical center
            justifyContent: "center", // Horizontal center
            backgroundColor: "white",
            cursor: "grab",
            whiteSpace: "nowrap",
          }}
        >
          <Typography sx={{ alignItems: "center" ,fontSize:"10px"}}>{label}</Typography>
        </Box>
      </DraggableItem>
    </div>
  );
}
