import Expression from "../expression.js";
import { FIELDS, TYPE_OPERATORS, OPERATORS, OPTIONS } from "./rule-mock.js";
function demo() {
  const element = document.getElementById("root");
  const anotherOne = document.getElementById("another");
  const thirdOne = document.getElementById("third");
  const expression = new Expression(
    FIELDS,
    TYPE_OPERATORS,
    OPERATORS,
    OPTIONS,
    OPERATORS
  );
  const expression2 = new Expression(
    FIELDS,
    TYPE_OPERATORS,
    OPERATORS,
    OPTIONS,
    OPERATORS
  );

  const expression3 = new Expression(
    FIELDS,
    TYPE_OPERATORS,
    OPERATORS,
    OPTIONS,
    OPERATORS
  );
  let result = null;
  let ex1 = expression.init({
    element,
    value: result,
  });
  let ex2 = expression2.init({
    element: anotherOne,
    value: result,
  });

  let ex3 = expression3.init({
    element: thirdOne,
    value: result,
  });

  $(".submit").on("click", () => {
    console.log(ex1());
    console.log(ex2());
    console.log(ex3());
  });
}

demo();
