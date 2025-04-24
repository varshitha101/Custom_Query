import { Button, Card, Box, Typography, Grid } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import handleLogout from "../services/Logout";
import OptionSelector from "../components/OptionSelector";
import bg_img from "../assets/bg.jpg";
import data from "../utils/data";
import { AuthChecker } from "../utils/AuthChecker";
import { TransitionGroup } from "react-transition-group";
import Fade from "@mui/material/Fade";
import { DndContext } from "@dnd-kit/core";
import DragCard from "../components/DragCard";
import DropCard from "../components/DropCard";
import {
  multiSelectFields,
  rangeSelectFields,
  rangeSelectPlusEnterFields,
} from "../utils/specialCaseFields";
import logo from "../assets/logo.png";
export default function Home() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  // const user = AuthChecker();
  const [selectors, setSelectors] = useState([
    {
      id: 0,
      selectedOption1: null,
      selectedOption2: null,
      selectedOption3: null,
    },
  ]);
  const [expression, setExpression] = useState([]);
  const [errorSelectors, setErrorSelectors] = useState([]);
  const [result, setResult] = useState([]);

  useEffect(() => {
    setResult(
      selectors
        .map((s) => {
          if (s.selectedOption1 && s.selectedOption2 && s.selectedOption3) {
            const isDateField = s.selectedOption2 === "Date";
            const isMultipleChoiceField = multiSelectFields.includes(
              s.selectedOption2
            );
            const isRangeSelectField = rangeSelectFields.includes(
              s.selectedOption2
            );
            const isRangeSelectPlusEnterFields =
              rangeSelectPlusEnterFields.includes(s.selectedOption2);

            let option3Value;

            if (isDateField) {
              option3Value = {
                SDate: String(s.selectedOption3.SDate?.valueOf()).slice(0, 10),
                LDate: String(s.selectedOption3.LDate?.valueOf()).slice(0, 10),
              };
            } else if (isMultipleChoiceField) {
              option3Value = s.selectedOption3.map((item) => item.id);
            } else if (isRangeSelectField) {
              option3Value = `${s.selectedOption3.operator} ${s.selectedOption3.name || s.selectedOption3.id}`;
            } else if (isRangeSelectPlusEnterFields) {
              option3Value = `${s.selectedOption3.operator} ${s.selectedOption3.value}`;
            } else if (typeof s.selectedOption3 === "object") {
              if (
                s.selectedOption3.operator &&
                s.selectedOption3.value !== undefined
              ) {
                option3Value = `${s.selectedOption3.operator} ${s.selectedOption3.value}`;
              } else {
                option3Value =
                  s.selectedOption3.value ||
                  s.selectedOption3.id ||
                  s.selectedOption3.name ||
                  "";
              }
            } else if (typeof s.selectedOption3 === "string") {
              option3Value = s.selectedOption3;
            } else {
              option3Value = s.selectedOption3;
            }

            return {
              id: s.id,
              selectedOption1: s.selectedOption1.msg,
              selectedOption2: s.selectedOption2,
              selectedOption3: option3Value,
            };
          }
          return null;
        })
        .filter((item) => item !== null) // Remove null values from result
    );
  }, [selectors]);

  // useEffect(() => {
  //   if (user === false) {
  //     notifications.show("Unauthorized access", {
  //       severity: "warning",
  //       autoHideDuration: 3000,
  //     });
  //     navigate("/");
  //   }
  // }, [navigate, notifications, user]);

  const handleLogOutSubmit = () => {
    handleLogout(navigate, notifications);
  };

  const handleNewOptions = (id) => {
    if (selectors.length >= 10) {
      notifications.show("Limit has reached", {
        severity: "warning",
        autoHideDuration: 3000,
      });
      return;
    }

    const newSelector = {
      id: 0,
      selectedOption1: null,
      selectedOption2: null,
      selectedOption3: null,
    };

    const insertIndex = selectors.findIndex((s) => s.id === id) + 1;

    const updatedSelectors = [
      ...selectors.slice(0, insertIndex),
      newSelector,
      ...selectors.slice(insertIndex),
    ];

    const reIndexedSelectors = updatedSelectors.map((s, i) => ({
      ...s,
      id: i,
    }));

    setSelectors(reIndexedSelectors);
    setExpression([]);
  };

  const handleDeleteSelector = (id) => {
    console.log("before delete selectors", selectors);
    console.log("before delete expression", expression);
    if (selectors.length > 1) {
      const updated = selectors.filter((sel) => sel.id !== id);
      const reIndexed = updated.map((s, i) => ({ ...s, id: i }));
      setSelectors(reIndexed);

      setExpression([]);
    } else {
      notifications.show("Last container cannot be deleted", {
        severity: "warning",
        autoHideDuration: 3000,
      });
    }
  };

  const errorChecker = () => {
    let hasErrors = false;
    const newErrorSelectors = selectors
      .map((s) => {
        const isDate = s.selectedOption2 === "Date";
        const selectedOptions = [
          s.selectedOption1 === null,
          s.selectedOption2 === null,
          isDate
            ? !s.selectedOption3?.SDate || !s.selectedOption3?.LDate
            : s.selectedOption3 === null,
        ];
        if (selectedOptions.some((option) => option)) {
          hasErrors = true;
          return { id: s.id, selectedOptions };
        }
        return null;
      })
      .filter(Boolean);
    setErrorSelectors(newErrorSelectors);
    return !hasErrors;
  };
  function validateExpression(expression) {
    if (!Array.isArray(expression) || expression.length === 0) {
      return { valid: false, error: "Expression is empty" };
    }

    const operators = ["AND", "OR"];
    let stack = [];
    let lastType = null;

    for (let i = 0; i < expression.length; i++) {
      const item = expression[i];

      if (item.type === "choice") {
        if (item.value === "(") {
          stack.push("(");
          // '(' can follow operator or be at start
          if (lastType === "selector") {
            return {
              valid: false,
              error: `Unexpected '(' after operand at position ${i + 1}`,
            };
          }
        } else if (item.value === ")") {
          if (stack.length === 0) {
            return {
              valid: false,
              error: `Unmatched ')' at position ${i + 1}`,
            };
          }
          stack.pop();
          // ')' cannot follow operator or '('
          if (lastType === "choice" && expression[i - 1].value !== ")") {
            return {
              valid: false,
              error: `Unexpected ')' after operator at position ${i + 1}`,
            };
          }
        } else if (operators.includes(item.value)) {
          // Operator cannot be at start or after another operator or '('
          if (
            i === 0 ||
            (lastType === "choice" && expression[i - 1].value !== ")") ||
            (lastType === "choice" && expression[i - 1].value === "(")
          ) {
            return {
              valid: false,
              error: `Unexpected operator "${item.value}" at position ${i + 1}`,
            };
          }
          // Operator cannot be at end
          if (i === expression.length - 1) {
            return {
              valid: false,
              error: `Expression cannot end with operator "${item.value}"`,
            };
          }
        } else {
          return {
            valid: false,
            error: `Unknown choice value "${item.value}" at position ${i + 1}`,
          };
        }
        lastType = "choice";
      } else if (item.type === "selector") {
        // Operand cannot follow another operand or ')'
        if (
          lastType === "selector" ||
          (lastType === "choice" && expression[i - 1].value === ")")
        ) {
          return {
            valid: false,
            error: `Unexpected operand at position ${i + 1}`,
          };
        }
        lastType = "selector";
      } else {
        return {
          valid: false,
          error: `Unknown type "${item.type}" at position ${i + 1}`,
        };
      }
    }

    if (stack.length > 0) {
      return { valid: false, error: "Unmatched opening parenthesis" };
    }

    // Expression cannot start or end with operator
    if (
      expression[0].type === "choice" &&
      operators.includes(expression[0].value)
    ) {
      return {
        valid: false,
        error: "Expression cannot start with an operator",
      };
    }
    if (
      expression[expression.length - 1].type === "choice" &&
      operators.includes(expression[expression.length - 1].value)
    ) {
      return { valid: false, error: "Expression cannot end with an operator" };
    }

    return { valid: true };
  }

  const handleSubmit = async () => {
    const isValid = errorChecker();
    if (!isValid) {
      notifications.show("Please fill all the fields", {
        severity: "warning",
        autoHideDuration: 3000,
      });
      return;
    }

    const { valid: isValidExpression, error: msg } =
      validateExpression(expression);
    if (!isValidExpression) {
      notifications.show(msg, {
        severity: "warning",
        autoHideDuration: 3000,
      });
      return;
    }

    notifications.show("Valid expression", {
      severity: "success",
      autoHideDuration: 3000,
    });
    const expressionString = expression.map((item) => {
      if (item.type === "selector") {
        return `Q${item.id + 1}`;
      } else if (item.type === "choice") {
        return item.value;
      }
      return item.value;
    });
    const expressionStringFinal = expressionString.join(" ");
    console.log("Expression String:", expressionStringFinal);
    console.log("Submission Result:", result);
    console.log("Expression:", expression);
  };

  function handleDragEnd(event) {
    const { active, over } = event;
    const activeId = active.id?.toString();
    const overId = over?.id?.toString();

    if (activeId?.startsWith("expression-selector-") && overId == null) {
      //remove selector from expression area

      const index = parseInt(activeId.split("-")[2], 10);
      setExpression((prevExpression) =>
        prevExpression.filter((_, i) => i !== index)
      );
    } else if (activeId?.startsWith("expression-choice-") && overId == null) {
      //remove choice from expression area

      const index = parseInt(activeId.split("-")[2], 10);
      setExpression((prevExpression) =>
        prevExpression.filter((_, i) => i !== index)
      );
    } else if (
      activeId?.startsWith("selector-") &&
      (overId?.startsWith("expression-choice-") ||
        overId?.startsWith("expression-selector-"))
    ) {
      // Add selector at specific position in expression area
      if (expression.length > 30) {
        notifications.show("Expression limit reached", {
          severity: "warning",
          autoHideDuration: 3000,
        });
        return;
      }
      const selectorId = parseInt(activeId.split("-")[1], 10);
      const selectedSelector = result.find((s) => s.id === selectorId);
      const position = parseInt(overId.at(-1), 10);

      
        if (selectedSelector) {
          setExpression((prevExpression) => {
            const updatedExpression = [...prevExpression];
            updatedExpression.splice(position, 0, {
              type: "selector",
              id: selectorId,
              label: `Q${selectorId + 1}`,
              value: selectedSelector,
            });
            return updatedExpression;
          });
        }else{
          notifications.show("fill the respective question", {
            severity: "error",
            autoHideDuration: 3000,
          });
          errorChecker();
        }
      
        
      
    } else if (
      activeId?.startsWith("selector-") &&
      (overId === "expression-drop-area" || overId?.startsWith("expression-"))
    ) {
      // Add selector to expression area
      if (expression.length > 30) {
        notifications.show("Expression limit reached", {
          severity: "warning",
          autoHideDuration: 3000,
        });
        return;
      }
      const selectorId = parseInt(activeId.split("-")[1], 10);
      
        const selectedSelector = result.find((s) => s.id === selectorId);

        if (selectedSelector) {
          setExpression((prevExpression) => [
            ...prevExpression,
            {
              type: "selector",
              id: selectorId,
              label: `Q${selectorId + 1}`,
              value: selectedSelector,
            },
          ]);
        }else{
          notifications.show("fill the respective question", {
            severity: "error",
            autoHideDuration: 3000,
          });
          errorChecker();
        }
      
        
      
    } else if (
      activeId?.startsWith("choiceSelectors-") &&
      (overId?.startsWith("expression-selector-") ||
        overId?.startsWith("expression-choice-"))
    ) {
      // Add choice at specific position in expression area
      if (expression.length > 30) {
        notifications.show("Expression limit reached", {
          severity: "warning",
          autoHideDuration: 3000,
        });
        return;
      }
      const choiceId = parseInt(activeId.split("-")[1], 10);
      const selectedChoice = choiceSelectors.find((c) => c.id === choiceId);
      const position = parseInt(overId.at(-1), 10);

      if (selectedChoice) {
        setExpression((prevExpression) => {
          const updatedExpression = [...prevExpression];
          updatedExpression.splice(position, 0, {
            type: "choice",
            id: selectedChoice.id,
            label: selectedChoice.name,
            value: selectedChoice.name,
          });
          return updatedExpression;
        });
      }
    } else if (
      activeId?.startsWith("choiceSelectors-") &&
      (overId === "expression-drop-area" || overId?.startsWith("expression-"))
    ) {
      // Add choice to expression area
      if (expression.length > 30) {
        notifications.show("Expression limit reached", {
          severity: "warning",
          autoHideDuration: 3000,
        });
        return;
      }
      const choiceId = parseInt(activeId.split("-")[1], 10);
      const selectedChoice = choiceSelectors.find((c) => c.id === choiceId);

      if (selectedChoice) {
        setExpression((prevExpression) => [
          ...prevExpression,
          {
            type: "choice",
            id: selectedChoice.id,
            label: selectedChoice.name,
            value: selectedChoice.name,
          },
        ]);
      }
    } else if (
      activeId?.startsWith("expression-") &&
      overId?.startsWith("expression-")
    ) {
      // Move selector within the expression area

      const oldIndex = parseInt(activeId.split("-")[2], 10);
      let newIndex = parseInt(overId.split("-")[2], 10);
      if (Number.isNaN(newIndex)) {
        newIndex = expression.length - 1;
      }

      const updatedExpression = [...expression];
      const [movedItem] = updatedExpression.splice(oldIndex, 1);
      updatedExpression.splice(newIndex, 0, movedItem);
      setExpression(updatedExpression);
    }
  }

  const choiceSelectors = [
    { id: 10, name: "AND" },
    { id: 11, name: "OR" },
    { id: 12, name: "(" },
    { id: 13, name: ")" },
  ];

  return (
    <Box
      sx={{
        p: 4,
        display: "flex",
        justifyContent: "center",
        backgroundImage: `url("${bg_img}")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        height: "100%",
        width: "100%",
        maxHeight: "100vh",
      }}
    >
      <Card sx={{ boxShadow: 3, width: "80%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            p: 2,
          }}
        >
          <img
            src={logo}
            alt="logo2"
            style={{ width: "40%", maxWidth: "100px", height: "10%" }}
          />
          <LogoutIcon
          sx={{
            width: "40px",
            height: "40px",
            backgroundColor: "primary.main",
            color: "white",
            borderRadius: "10%",
            border: 1,
            padding: 0.5,
                   }} 
          onClick={handleLogOutSubmit}/>
         
        </Box>
        <Box
          sx={{
            paddingX: 2,
          }}
        >
          <Box
            sx={{
              overflowY: "auto",
              border: 1,
              borderColor: "#868686",
              borderRadius: "10px",
              height: "50vh",
            }}
          >
            <TransitionGroup>
              {selectors.map((selector) => (
                <Fade key={selector.id} timeout={1000}>
                  <Box sx={{ mb: 0 }}>
                    <OptionSelector
                      id={selector.id}
                      data={data}
                      errorSelectors={errorSelectors}
                      onDelete={handleDeleteSelector}
                      onAdd={handleNewOptions}
                      selectors={selectors}
                      setSelectors={setSelectors}
                      setExpression={setExpression}
                    />
                  </Box>
                </Fade>
              ))}
            </TransitionGroup>
          </Box>
          <Box
            sx={{
              p: 2,
              marginTop: 2,
              border: 1,
              height: "100%",
              borderColor: "#868686",
              borderRadius: "10px",
              alignItems: "center",
            }}
          >
            <Box>
              <DndContext onDragEnd={handleDragEnd}>
                <Box sx={{ flexShrink: 0 }}>
                  <DragCard
                    selectors={selectors}
                    choiceSelectors={choiceSelectors}
                    expression={expression}
                  />
                </Box>

                <Box
                  sx={{
                    border: 1,
                    borderRadius: "5px",
                    marginTop: 1,
                    flexGrow: 1,
                  }}
                >
                  <Box
                    id="expression-drop-area"
                    sx={{
                      p: 1,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      alignItems: "center",
                    }}
                  >
                    <DropCard
                      expression={expression}
                      setExpression={setExpression}
                    />
                  </Box>
                </Box>
              </DndContext>
            </Box>
          </Box>

          <Box sx={{ marginY: 1, textAlign: "center" }}>
            <Button variant="contained" color="success" onClick={handleSubmit}>
              Submit
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
