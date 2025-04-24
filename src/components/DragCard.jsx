import Box from "@mui/material/Box";
import { useDraggable } from "@dnd-kit/core";
import { Grid } from "@mui/material";

export function DraggableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <Box ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </Box>
  );
}

// Utility function to chunk an array into rows
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export default function DragCard({ selectors, choiceSelectors, expression }) {
  const usedSelectorIds = new Set(
    expression.filter((item) => item.type === "selector").map((item) => item.id)
  );

  const availableSelectors = selectors.filter(
    (s) => !usedSelectorIds.has(s.id)
  );
  const selectorChunks = chunkArray(availableSelectors, 10); // Split into rows of 5

  return (
    <Box>
      <Grid container spacing={1}>
        <Grid
          size={4}
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: "center",
            direction: "row",
            borderRight: 1,
          }}
        >
          {/* Logic Gate Buttons (AND, OR, etc.) */}
          {choiceSelectors.map((c) => (
            <DraggableItem
              key={`choiceSelectors-${c.id}`}
              id={`choiceSelectors-${c.id}`}
            >
              <Box
                sx={{
                  border: 1,
                  width: "40px",
                  height: "30px",
                  textAlign: "center",
                  cursor: "grab",
                  backgroundColor: "#f9fbe7",
                  borderRadius: 1,
                }}
              >
                {c.name}
              </Box>
            </DraggableItem>
          ))}
        </Grid>
        <Grid size={8}>
          {/* Render selector chunks in separate rows */}
          {selectorChunks.map((chunk, rowIndex) => (
            <Box
              key={`selector-row-${rowIndex}`}
              sx={{ flexDirection: "row", display: "flex", gap: 1 }}
            >
              {chunk.map((s) => (
                <DraggableItem key={`selector-${s.id}`} id={`selector-${s.id}`}>
                  <Box
                    sx={{
                      border: 1,
                      width: "40px",
                      textAlign: "center",
                      cursor: "grab",
                      backgroundColor: "#e0f7fa",
                      height: "30px",
                      borderRadius: 1,
                    }}
                  >
                    {`Q${s.id + 1}`}
                  </Box>
                </DraggableItem>
              ))}
            </Box>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
}
