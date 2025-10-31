import Box from "@mui/material/Box";
import { Grid, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { useDraggable } from "@dnd-kit/core";

export function DraggableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <Box ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </Box>
  );
}

/**
 *  Function to chunk an array into smaller arrays of a specified size.
 *  This is useful for displaying items in a grid or list format where you want to limit the number of items per row.
 * @param {number} array
 * @param {number} size
 * @returns {Array} Returns a new array containing chunks of the original array, each of the specified size.
 */
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export default function DragCard({ selectors, choiceSelectors, expression }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMd = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));

  let selectorsPerRow = 5;
  if (isXs) selectorsPerRow = 2;
  else if (isSm) selectorsPerRow = 3;
  else if (isMd) selectorsPerRow = 4;
  else if (isLg) selectorsPerRow = 10;

  const usedSelectorIds = new Set(expression.filter((item) => item.type === "selector").map((item) => item.id));
  const availableSelectors = selectors.filter((s) => !usedSelectorIds.has(s.id));
  const selectorChunks = chunkArray(availableSelectors, selectorsPerRow);

  return (
    <Box sx={{ width: "100%", minHeight: "56px" }}>
      <Grid container sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}>
        <Grid
          sx={{
            display: "flex",
            minHeight: "72px",
            gap: 1,
            justifyContent: { xs: "flex-start", sm: "center" },
            flexDirection: "row",
            borderRight: { xs: "none", sm: 1, md: 1, lg: 1, xl: 1 },
            borderColor: "divider",
            size: { xs: 12, sm: 4 },
            flexWrap: { xs: "wrap", sm: "nowrap" },
            p: 2,
          }}>
          {choiceSelectors.map((c) => (
            <DraggableItem key={`choiceSelectors-${c.id}`} id={`choiceSelectors-${c.id}`}>
              <Box
                sx={{
                  border: 1,
                  width: { xs: "32px", sm: "40px" },
                  height: { xs: "28px", sm: "30px" },
                  textAlign: "center",
                  cursor: "grab",
                  backgroundColor: "#f9fbe7",
                  borderRadius: 1,
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                }}>
                {c.name}
              </Box>
            </DraggableItem>
          ))}
        </Grid>
        <Grid sx={{ size: { xs: 12, sm: 8 }, minHeight: "72px", p: 2 }}>
          {selectorChunks.map((chunk, rowIndex) => (
            <Box
              key={`selector-row-${rowIndex}`}
              sx={{
                flexDirection: "row",
                display: "flex",
                gap: 1,
                mb: 1,
                flexWrap: { xs: "wrap", sm: "nowrap" },
                justifyContent: { xs: "flex-start", sm: "flex-start" },
              }}>
              {chunk.map((s) => (
                <DraggableItem key={`selector-${s.id}`} id={`selector-${s.id}`}>
                  <Box
                    sx={{
                      border: 1,
                      width: { xs: "32px", sm: "40px" },
                      textAlign: "center",
                      cursor: "grab",
                      backgroundColor: "#e0f7fa",
                      height: { xs: "28px", sm: "30px" },
                      borderRadius: 1,
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      userSelect: "none",
                    }}>
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
