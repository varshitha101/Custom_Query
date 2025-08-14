import { keyframes } from "@mui/system";
import CircularProgress from "@mui/joy/CircularProgress";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Fade from "@mui/material/Fade";
import LogoutIcon from "@mui/icons-material/Logout";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import DialogContent from "@mui/joy/DialogContent";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { TransitionGroup } from "react-transition-group";
import { toast } from "react-toastify";
import { DndContext } from "@dnd-kit/core";
import handleLogout from "../services/Logout";
import OptionSelector from "../components/OptionSelector";
import bg_img from "../assets/bg.jpg";
import data from "../services/utils/data";
import { AuthChecker } from "../services/AuthChecker";
import DragCard from "../components/DragCard";
import DropCard from "../components/DropCard";
import { multiSelectFields, rangeSelectFields, rangeSelectPlusEnterFields } from "../services/utils/specialCaseFields";
import logo from "../assets/logo.png";
import { patientNode, form_1Node, mvdNode, form_3Node, tcc_form } from "../services/utils/NodeDetail";
import handleQueryFetch from "../services/QueryFetch";
import validateExpression from "../services/utils/ExpressionVaidator";

export default function Home() {
  useEffect(() => {
    localStorage.removeItem("_grecaptcha");
  }, []);
  const navigate = useNavigate();
  const user = AuthChecker();
  // Effect to check if the user is unauthorized
  // If the user is unauthorized, it redirects to the login page and shows an error message
  // useEffect(() => {
  //   if (user === false) {
  //     toast.error("Unauthorized access");
  //     navigate("/");
  //   }
  // }, [navigate, user]);
  const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
`;
  const [isInvalidDrop, setIsInvalidDrop] = useState(false);
  // State variables to manage selectors, expression, errors, results, loading state, and time tracking
  // selectors: Array of objects representing the selected options
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
  const [isLoading, setIsLoading] = useState(false);
  const [isDateSelect, setIsDateSelect] = useState(false);
  const [recivedLength, setRecivedLength] = useState(0);
  const [isReciving, setIsReciving] = useState(false);
  const [isLogoutClicked, setIsLogoutClicked] = useState(false);
  const choiceSelectors = [
    { id: 10, name: "AND" },
    { id: 11, name: "OR" },
    { id: 12, name: "(" },
    { id: 13, name: ")" },
  ];
  const [processingNode, setProcessingNode] = useState("");
  const nodeVlaue = {
    patients1: "Patients",
    Form_1: "Form 1",
    manual_vital_data: "Manual Vital Data",
    Form_3: "Form 3",
    tcc_form: "TCC Form",
    general: "Form 1",
  };
  // Effect to check if any selector has "Date" as selectedOption2
  // This will set isDateSelect to true if any selector has "Date" selected
  useEffect(() => {
    const hasDate = selectors.some((sel) => sel.selectedOption2 === "Date");
    setIsDateSelect(hasDate);
  }, [selectors]);

  // Effect to update the result state based on the selectors
  // It processes each selector and formats the selected options accordingly
  useEffect(() => {
    setResult(
      selectors
        .map((s) => {
          if (s.selectedOption1 && s.selectedOption2 && s.selectedOption3) {
            const isDateField = s.selectedOption2 === "Date";
            const isMultipleChoiceField = multiSelectFields.includes(s.selectedOption2);
            const isRangeSelectField = rangeSelectFields.includes(s.selectedOption2);
            const isRangeSelectPlusEnterFields = rangeSelectPlusEnterFields.includes(s.selectedOption2);

            let option3Value;

            if (isDateField) {
              option3Value = {
                SDate: String(s.selectedOption3.SDate?.valueOf()).slice(0, 10),
                LDate: String(s.selectedOption3.LDate?.valueOf() + 24 * 60 * 60 * 1000).slice(0, 10),
              };
            } else if (isMultipleChoiceField) {
              option3Value = s.selectedOption3.map((item) => item.id);
            } else if (isRangeSelectField) {
              option3Value = `${s.selectedOption3.operator} ${s.selectedOption3.name || s.selectedOption3.id}`;
            } else if (isRangeSelectPlusEnterFields) {
              option3Value = `${s.selectedOption3.operator} ${s.selectedOption3.value}`;
            } else if (typeof s.selectedOption3 === "object") {
              if (s.selectedOption3.operator && s.selectedOption3.value !== undefined) {
                option3Value = `${s.selectedOption3.operator} ${s.selectedOption3.value}`;
              } else {
                option3Value = s.selectedOption3.value || s.selectedOption3.id || s.selectedOption3.name || "";
              }
            } else if (typeof s.selectedOption3 === "string") {
              option3Value = s.selectedOption3;
            } else {
              option3Value = s.selectedOption3;
            }
            let nodeValue = null;
            if (patientNode.includes(s.selectedOption2)) {
              nodeValue = "patients1";
            } else if (form_1Node.includes(s.selectedOption2) && s.selectedOption1.msg === "Survey") {
              nodeValue = "Form_1";
            } else if (mvdNode.includes(s.selectedOption2)) {
              nodeValue = "manual_vital_data";
            } else if (form_3Node.includes(s.selectedOption2)) {
              nodeValue = "Form_3";
            } else if (tcc_form.includes(s.selectedOption2)) {
              nodeValue = "tcc_form";
            } else {
              nodeValue = "general";
            }
            return {
              id: s.id,
              selectedOption1: s.selectedOption1.msg,
              selectedOption2: s.selectedOption2,
              selectedOption3: option3Value,
              selectedOption4: nodeValue,
            };
          }
          return null;
        })
        .filter((item) => item !== null) // Remove null values from result
    );
  }, [selectors]);

  /**
   * Function to handle the logout submission
   */
  const handleLogOutSubmit = useCallback(() => {
    handleLogout(navigate, setIsLogoutClicked);
  }, [navigate]);

  /**
   * Function to handle the addition of new options
   * It checks if the maximum number of selectors (10) is reached before adding a new selector
   * It inserts the new selector after the specified selector ID
   * It also resets the expression state
   * @param {number} id - The ID of the selector after which the new selector should be added
   * @returns {void}
   */
  const handleNewOptions = useCallback(
    (id) => {
      if (selectors.length >= 10) {
        toast.error("Maximum 10 selectors allowed");
        return;
      }

      const newSelector = {
        id: 0,
        selectedOption1: null,
        selectedOption2: null,
        selectedOption3: null,
      };

      const insertIndex = selectors.findIndex((s) => s.id === id) + 1;

      const updatedSelectors = [...selectors.slice(0, insertIndex), newSelector, ...selectors.slice(insertIndex)];

      const reIndexedSelectors = updatedSelectors.map((s, i) => ({
        ...s,
        id: i,
      }));

      setSelectors(reIndexedSelectors);
      setExpression([]);
    },
    [selectors]
  );

  /**
   * Function to handle the deletion of a selector
   * It checks if there is more than one selector before allowing deletion
   * It filters out the selector with the specified ID and re-indexes the remaining selectors
   * It also resets the expression state
   * @param {number} id - The ID of the selector to be deleted
   * @return {void}
   */
  const handleDeleteSelector = useCallback(
    (id) => {
      console.log("before delete selectors", selectors);
      console.log("before delete expression", expression);
      if (selectors.length > 1) {
        const updated = selectors.filter((sel) => sel.id !== id);
        const reIndexed = updated.map((s, i) => ({ ...s, id: i }));
        setSelectors(reIndexed);

        setExpression([]);
      } else {
        toast.error("At least one selector is required");
      }
    },
    [selectors, expression]
  );

  /**
   * Function to check for errors in the selectors
   * It checks if any selector has null values for selectedOption1, selectedOption2, or selectedOption3
   * If any errors are found, it sets the errorSelectors state with the IDs and error status of each selector
   * @returns {boolean} - Returns true if no errors are found, false otherwise
   */
  const errorChecker = useCallback(() => {
    let hasErrors = false;
    const newErrorSelectors = selectors
      .map((s) => {
        const isDate = s.selectedOption2 === "Date";
        const selectedOptions = [s.selectedOption1 === null, s.selectedOption2 === null, isDate ? !s.selectedOption3?.SDate || !s.selectedOption3?.LDate : s.selectedOption3 === null];
        if (selectedOptions.some((option) => option)) {
          hasErrors = true;
          return { id: s.id, selectedOptions };
        }
        return null;
      })
      .filter(Boolean);
    setErrorSelectors(newErrorSelectors);
    return !hasErrors;
  }, [selectors]);

  /**
   * Function to handle the submission of the expression
   * It first checks for errors using the errorChecker function
   * If there are errors, it shows an error toast message
   * It then validates the expression using the validateExpression function
   * If the expression is invalid, it shows an error toast message
   * It constructs the expression string from the expression state
   * Finally, it calls the handleQueryFetch function to fetch the query results
   * @param {void}
   * @returns {void} - Returns a promise that resolves when the query fetch is complete
   */
  const handleSubmit = useCallback(async () => {
    const isValid = errorChecker();
    if (!isValid) {
      toast.error("Please fill all the fields correctly");
      return;
    }

    const { valid: isValidExpression, error: msg } = validateExpression(expression);
    if (!isValidExpression) {
      toast.error(`Invalid expression: ${msg}`);
      return;
    }

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

    // setTotalLength(0);
    // setRecivedLength(0);

    // await handleQueryFetch(expression, expressionStringFinal, notifications, setIsLoading, setstartTime, setendTime, setTotalLength, setRecivedLength, setIsRecived);
    await handleQueryFetch(expression, expressionStringFinal, setIsLoading, setRecivedLength, setIsReciving, setProcessingNode);
  }, [errorChecker, expression, result]);

  /**
   *  Function to handle the end of a drag event
   * It checks the IDs of the active and over elements to determine the type of drag and drop action
   * It handles adding or removing selectors and choices from the expression area
   * It also checks for expression length limits and triggers a shake animation if the drop is invalid
   * @param {*} event
   * @returns {void}
   */
  function handleDragEnd(event) {
    const { active, over } = event;

    const activeId = active.id?.toString();
    const overId = over?.id?.toString();

    if (!activeId && !overId) {
      console.warn("Drag event missing IDs:", { activeId, overId });
      return;
    }

    if (expression.length > 50) {
      toast.error("Expression limit reached (50 items)");
      setIsInvalidDrop(true); // Trigger shake animation
      setTimeout(() => setIsInvalidDrop(false), 500); // Reset animation after 500ms
      console.warn("Expression length exceeded:", expression.length);
      return;
    }
    if (activeId?.startsWith("expression-selector-") && overId == null) {
      //remove selector from expression area

      const index = parseInt(activeId.split("-")[2], 10);
      setExpression((prevExpression) => prevExpression.filter((_, i) => i !== index));
    } else if (activeId?.startsWith("expression-choice-") && overId == null) {
      //remove choice from expression area

      const index = parseInt(activeId.split("-")[2], 10);
      setExpression((prevExpression) => prevExpression.filter((_, i) => i !== index));
    } else if (activeId?.startsWith("selector-") && (overId?.startsWith("expression-choice-") || overId?.startsWith("expression-selector-"))) {
      // Add selector at specific position in expression area
      if (expression.length > 50) {
        toast.error("Expression limit reached (50 items)");
        setIsInvalidDrop(true); // Trigger shake animation
        setTimeout(() => setIsInvalidDrop(false), 500); // Reset animation after 500ms
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
      } else {
        errorChecker();
      }
    } else if (activeId?.startsWith("selector-") && (overId === "expression-drop-area" || overId?.startsWith("expression-"))) {
      // Add selector to expression area
      if (expression.length > 50) {
        toast.error("Expression limit reached (50 items)");
        setIsInvalidDrop(true); // Trigger shake animation
        setTimeout(() => setIsInvalidDrop(false), 500); // Reset animation after 500ms
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
      } else {
        errorChecker();
      }
    } else if (activeId?.startsWith("choiceSelectors-") && (overId?.startsWith("expression-selector-") || overId?.startsWith("expression-choice-"))) {
      // Add choice at specific position in expression area
      if (expression.length > 50) {
        toast.error("Expression limit reached (50 items)");
        setIsInvalidDrop(true); // Trigger shake animation
        setTimeout(() => setIsInvalidDrop(false), 500); // Reset animation after 500ms
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
    } else if (activeId?.startsWith("choiceSelectors-") && (overId === "expression-drop-area" || overId?.startsWith("expression-"))) {
      // Add choice to expression area
      if (expression.length > 50) {
        toast.error("Expression limit reached (50 items)");
        setIsInvalidDrop(true); // Trigger shake animation
        setTimeout(() => setIsInvalidDrop(false), 500); // Reset animation after 500ms
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
    } else if (activeId?.startsWith("expression-") && overId?.startsWith("expression-")) {
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

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: `url("${bg_img}")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        height: "100%",
        width: "100%",
        position: "absolute",
      }}>
      <Card sx={{ boxShadow: 3, width: "80%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            p: 2,
          }}>
          <img src={logo} alt="logo2" style={{ width: "40%", maxWidth: "100px", height: "10%" }} />
          <LogoutIcon
            sx={{
              width: "40px",
              height: "40px",
              backgroundColor: "primary.main",
              color: "white",
              borderRadius: "20%",
              border: 1,
              padding: 0.5,
            }}
            disabled={isLogoutClicked}
            onClick={handleLogOutSubmit}
          />
        </Box>
        <Box
          sx={{
            paddingX: 2,
          }}>
          <Box
            sx={{
              overflowY: "auto",
              border: 1,
              borderColor: "#868686",
              borderRadius: "10px",
              height: "50vh",
            }}>
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
                      isDateSelect={isDateSelect}
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
            }}>
            <Box>
              <DndContext onDragEnd={handleDragEnd}>
                <Box sx={{ flexShrink: 0 }}>
                  <DragCard selectors={selectors} choiceSelectors={choiceSelectors} expression={expression} />
                </Box>

                <Box
                  sx={{
                    border: 1,
                    borderRadius: "5px",
                    marginTop: 1,
                    flexGrow: 1,
                  }}>
                  <Box
                    id="expression-drop-area"
                    sx={{
                      p: 1,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      alignItems: "center",
                      animation: isInvalidDrop ? `${shakeAnimation} 0.5s` : "none",
                    }}>
                    <DropCard expression={expression} setExpression={setExpression} />
                  </Box>
                </Box>
              </DndContext>
            </Box>
          </Box>

          <Box sx={{ marginY: 1, display: "flex", justifyContent: "center", alignItems: "center", direction: "row" }}>
            <Button variant="contained" color="success" onClick={handleSubmit}>
              Submit
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Loader Modal for isLoading */}
      <Modal open={isLoading}>
        <ModalDialog variant="outlined">
          <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CircularProgress /> {processingNode === "" ? "Loading..." : `Processing ${nodeVlaue[processingNode]}`}
          </DialogContent>
        </ModalDialog>
      </Modal>
      <Modal open={recivedLength > 0 && isReciving}>
        <ModalDialog variant="outlined">
          <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CircularProgress size="lg" color="success" />
            Exporting {recivedLength}
          </DialogContent>
        </ModalDialog>
      </Modal>
      <Typography
        style={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          color: "gray",
        }}>
        Ver 0.10
      </Typography>
    </Box>
  );
}
