import * as U from "./utils.js";
export default class Expression {
  element = null;
  fileds = [];
  typeOperators = {};
  operatorsList = []; // 操作符label和key
  operators = [];
  options = {};
  existKeyList = []; // 没有重复，不需要重新添加preKey进行rename的keyList
  rangeOperator = ["between", "not_between"]; // 多选框范围
  setting = {
    view: {
      dblClickExpand: false,
      showLine: false,
    },
    data: {
      key: {
        title: "label",
        name: "label",
        operator: "operator",
        field: "field",
        value: "value",
        id: "id",
        label: "label",
        operator_label: "operator_label",
        value_label: "value_label",
        value__key: "value__key",
        type: "type",
        operator_type: "operator_type",
      },
      simpleData: {
        enable: true,
      },
    },
    callback: {
      onClick: this.handleZTreeClick.bind(this),
    },
  };

  noData = [
    {
      field: "no data",
      label: "暂无数据可选",
      chkDisabled: false, // TODO：不可点击
    },
  ];
  operatorPreKey = "operator_";
  valuePreKey = "value_";

  // 一个表达式该有的属性
  addOneExpressions = {
    id: null,
    operator: null,
    field: null,
    value: null,
    label: null,
    sub_expressions: [],
  };
  // 平复只有rule选框被选择时的对象值
  clearCurrentExpression = {
    operator: null,
    value: null,
    sub_expressions: [],
  };
  emptyExpressions = null; // 原始空表达式集合
  expressionRes = {
    operator: "and", // 绑定外部and / or
    sub_expressions: [], // 表达式
  }; // 获取的组件值
  initExpressionRes = {
    // 初始表达式集合，为空
    operator: "and",
    sub_expressions: [],
  };
  expressionOuterWrapContainerClass = ".expression-wrap"; // 最外层
  conditionGroupClass = "condition-group"; // 条件组样式，区别于单个条件
  conditionSingleClass = "condition-single"; // 单个条件样式
  singleExpressionClass = "single-expression"; // 单条表达式expression样式
  currentId = null; // 当前点击的选择框的id
  hiddenClass = "hidden";
  outerConditionWrapClass =
    ".add-expression-button-wrap~.expression-operator.condition-single > .expression-container"; // 最外层的表达式组
  //   添加按钮wrap
  groupWrapperOfExpressions =
    ".expression-wrap > .expression-operator > .expression-container"; // 子级条件组的插入wrap
  expressionWrap = `
    <div id="expression-wrap" class="expression-wrap">
        <div class="add-expression-button-wrap">
            <p class="add-item-button"><span class="add-sub-item add-sub-item-list">+</span>添加条件</p>
            <p class="add-item-list-button"><span class="add-sub-item add-sub-item-list">+</span>添加条件组</p>
        </div>
    </div>
  `;

  // 其他输入框类型dom节点——input | range
  getOtherInputType(showInputType, expression = null) {
    if (!showInputType) {
      return "";
    }
    const currentExpression =
      this.getCurrentExpression(this.expressionRes, expression?.id) ?? null;
    const isRange = this.rangeOperator.includes(currentExpression?.operator);
    const inputType = currentExpression?.type ?? "text";
    const hidden = expression ? "" : this.hiddenClass;
    const lastRangeInput = isRange
      ? `<input value="${
          (Array.isArray(expression?.value)
            ? expression?.value?.[1]
            : expression?.value) ?? ""
        }" type="${inputType}"/>`
      : "";
    return `
      <div class="${hidden} input-and-range-dom ${
      isRange ? "range-dom" : "input-dom"
    }">
        <input type="${inputType}" value="${
      (Array.isArray(expression?.value)
        ? expression?.value?.[0]
        : expression?.value) ?? ""
    }"/>
        ${lastRangeInput}
      </div>
    `;
  }
  // select组件模块
  getInputType(
    className,
    showMoreInputType = false,
    inputText = "",
    expression = null
  ) {
    return `
        <div class="select-tree ${showMoreInputType ? this.hiddenClass : ""}">
            <div class="select-content ${className}">
                <p class="select-input">${inputText ?? ""}</p>
                <span class="arrow-down"></span>
            </div>
            <ul id="ztree-id" class="ztree hidden"></ul>
        </div>
        ${this.getOtherInputType(showMoreInputType, expression)}
    `;
  }
  /**
   *
   * @param {*} inputType 插入的录入信息框类型：select(ztree) || input || range
   * @param {*} id
   * @returns DOM节点
   * 第一个和第二个框的输入方式必然是下拉框的ztree形式，因为都是select形式的获取数据方式
   */
  getExpressionContent(inputType, id, expression = null) {
    return `
      <div class="expression-content" id="${expression?.id ?? id}">
          ${inputType(
            "class-key",
            false,
            expression?.label ?? expression?.field ?? "- 请选择规则 -"
          )}
          ${inputType(
            "class-operator",
            false,
            expression?.operator_label ?? expression?.operator
          )}
          ${inputType(
            "class-value",
            expression && !expression?.hasOwnProperty("options_key"),
            expression?.value_label ?? expression?.value,
            expression
          )}
          <span class="content-add-delete-item add-item">+</span>  
          <span class="content-add-delete-item delete-current-item">-</span>
      </div>
    `;
  }

  constructor(fileds, typeOperators, operators, options, operatorsList) {
    this.fileds = fileds;
    this.handleZTreeClick = this.handleZTreeClick.bind(this);
    this.getInputType = this.getInputType.bind(this);
    this.getExpressionComponent = this.getExpressionComponent.bind(this);
    this.addSingleExpression = this.addSingleExpression.bind(this);
    this.addExpression = this.addExpression.bind(this);
    this.addExpressionContentToExpressionWrap =
      this.addExpressionContentToExpressionWrap.bind(this);
    this.handlePutAway = this.handlePutAway.bind(this);
    this.typeOperators = typeOperators;
    this.operators = operators;
    this.options = options;
    this.operatorsList = operatorsList;
    this.getValue = this.getValue.bind(this);
  }

  // 条件模块（表达式 + 复杂操作符and | or）, total用于处理添加几个条件模块
  getExpressionComponent(
    expressionContent,
    selectTree,
    conditionClass,
    id, // 数组
    total = 1,
    expressions = null
  ) {
    let content = "";
    let tempIndex = 0;
    while (tempIndex < total) {
      content += expressionContent(
        selectTree,
        id[tempIndex],
        expressions?.sub_expressions[tempIndex]
      );
      tempIndex++;
    }
    return `
        <div class="expression-operator ${conditionClass}">
            <select
            name="operators" id="operator-select" class="${id[0]} ${
      total === 1 ? this.hiddenClass : ""
    }">
                <option value="and" ${
                  expressions?.operator === "and" ? "selected" : ""
                }>AND</option>
                <option value="or" ${
                  expressions?.operator === "or" ? "selected" : ""
                }>OR</option>
            </select>
            <div class="expression-container">${content}</div>
        </div>
    `;
  }

  init({ element, value }) {
    if (!element) {
      console.error("请输入节点id");
    }

    this.element = element;
    $(element).append(this.expressionWrap);
    // 获取存在的key,思考要不要rename
    this.getNotRenameList(this.fileds, "fileds_");
    this.getNotRenameList(this.operatorsList, this.operatorPreKey);
    this.getNotRenameList(this.options, this.valuePreKey);
    this.emptyExpressions = U.deepClone(this.expressionRes); // 复制一个空盒

    this.setExpressions(value);

    // 监听button => 添加单个条件
    $(this.element)
      .find(".add-expression-button-wrap .add-item-button")
      .on("click", (e) => {
        //   如果没有父级节点则新增一个条件组，条件只有一个，否则就只新增条件
        const targetWrap = $(e.target).closest(".expression-wrap");
        if (targetWrap.children(".expression-operator").length) {
          this.addSingleExpression(
            targetWrap.find(".expression-container:first")
          );
        } else {
          // 这里似乎已经不走了，因为现在是不会删除单个条件所需要的壳儿
          this.addExpression();
        }
      });
    // 监听button => 添加条件组
    $(this.element)
      .find(".add-expression-button-wrap .add-item-list-button")
      .on("click", (e) => {
        const targetWrap = $(e.target).closest(".expression-wrap");
        this.addExpression(
          this.conditionGroupClass,
          targetWrap.find(".expression-operator > .expression-container:first"), // 寻找总wrap下的子集操作符集合下的第一个container，嵌套一层副级即可
          2
        ); // 一次性添加两个条件
      });

    this.handlePutAway();
    return this.getValue;
  }

  // 因为要新增，要判断当前是否已经有表达式，如果有，就把操作符搞出来
  mackComplexOperatorShow() {
    if (this.expressionRes?.sub_expressions.length > 1) {
      const complexOperator = $(
        ".expression-wrap .expression-operator.condition-single > #operator-select"
      );
      complexOperator.removeClass(this.hiddenClass);
    }
  }

  // 添加单个条件组（条件默认只有一个）
  addExpression(
    conditionClass = this.conditionSingleClass,
    expressionContainer = $(this.element).children(
      this.expressionOuterWrapContainerClass
    ),
    totalNum = 1,
    expressions = null
  ) {
    let id = expressions?.sub_expressions.map((item) => item.id) ?? [];
    // id.length < totalNum 则新增id
    while (id.length < totalNum) {
      id.push(U.getRandomId());
    }

    // 这段代码也不会走了好像，也是因为删除的时候不会删除彻底的原因
    let isParentFlag =
      expressionContainer === this.expressionOuterWrapContainerClass ||
      $(expressionContainer).length === 0;

    // 获取要展示的节点
    const expressComponent = this.getExpressionComponent(
      this.getExpressionContent,
      this.getInputType,
      conditionClass,
      id,
      totalNum,
      expressions
    );

    // 因为要新增，要判断当前是否已经有表达式，如果有，就把操作符搞出来
    this.mackComplexOperatorShow();

    if (isParentFlag) {
      // 这段代码也不会走了好像，也是因为删除的时候不会删除彻底的原因
      expressionContainer = $(this.element).children(
        this.expressionOuterWrapContainerClass
      );
    }
    if (!expressions) {
      this.addExpressionRes(id, isParentFlag, null, totalNum);
    }
    expressionContainer.append(expressComponent);
    // 设置监听最外层操作符的值的代码
    this.handleSelectVal(id[0]);
    this.addExpressionContentToExpressionWrap();
  }

  handleSelectVal(id) {
    $(`select#operator-select.${id}`).on("change", (e) => {
      const subExpressionArr = this.expressionRes.sub_expressions;
      let flag = -1;
      let subFlag = -1;
      let index = 0;
      for (let item of subExpressionArr) {
        // 第一层找了，flag === -1 ？ 第一层找不到 ： 找到了
        flag = item.sub_expressions.findIndex((item) => item.id === id);
        if (item.sub_expressions.length === 1 && flag > -1) {
          this.expressionRes.operator = $(e.target).val();
          return;
        }
        // flag 没找到, 找第二层
        if (flag > -1) {
          this.expressionRes.sub_expressions[index].operator = $(
            e.target
          ).val();
          return;
        }
        index++;
      }
    });
  }

  /**
   * 添加单个条件模块并初始化对应click事件
   * @param {*} contentElement : 父级节点，用于挂载
   * @param {*} beforeSiblingId ：beforeSiblingId, 用于判断是否是副级
   * @param {*} expression ：表达式，用于填充数据
   */
  addSingleExpression(
    contentElement,
    beforeSiblingId = null,
    expression = null,
    conditionClass = this.singleExpressionClass
    // totalNum = 1
  ) {
    let id = [expression?.sub_expressions[0].id ?? U.getRandomId()];
    // 没有条件节点时，添加节点需要把操作符号and | or的hidden 挪掉
    if (!$(contentElement).children().length) {
      $(contentElement)
        .closest(".expression-operator.condition-single")
        .find("#operator-select")
        .addClass(id[0]);
    }
    // 获取展示节点
    const expressComponent = this.getExpressionComponent(
      this.getExpressionContent,
      this.getInputType,
      conditionClass,
      id,
      id.length,
      expression
    );
    this.mackComplexOperatorShow();
    contentElement.append(expressComponent);
    // 注意：这里需要确认到底是添加在已有子集里还是父集里（集：集合）
    // 表达式存在意为填充数据，因此不需要再添加数据到表达式集合里
    if (!expression) {
      this.addExpressionRes(id, !beforeSiblingId, beforeSiblingId, id.length);
    }
    this.addExpressionContentToExpressionWrap();
  }

  //   注册监听事件
  addExpressionContentToExpressionWrap() {
    const addClick = $(this.element).find(".add-item");
    const deleteClick = $(this.element).find(".delete-current-item");
    const chooseRule = $(this.element).find(".select-content");

    // 移除之前已经存在的点击事件
    U.initRemoveClickEvent([addClick, deleteClick, chooseRule]);

    //   添加单个规则
    addClick.on("click", (e) => {
      const parent = $(e.target).closest(".expression-container");
      const hasParent = $(e.target).closest(
        ".expression-operator.condition-group"
      ).length;
      const beforeSiblingId = hasParent
        ? $(e.target).closest(".expression-content").attr("id")
        : null;
      this.addSingleExpression(parent, beforeSiblingId);
    });

    // 删除规则：删除当前节点，如果当前节点是最后一个，删除对应的父级容器中
    deleteClick.on("click", (e) => {
      const targetOperator = $(e.target).closest(".expression-operator");
      const targetExpressionContent = $(e.target).closest(
        ".expression-content"
      );
      if (
        $(e.target).closest(".expression-container").children().length === 1
      ) {
        // 条件组被删完了，可以整个操作模块都干掉，包括and or 操作节点(是后续添加的单个表达式进入表达式组 || 是表达式组的一份子)
        if (
          targetOperator.hasClass(this.conditionGroupClass) ||
          targetOperator.parents(".condition-group").length
        ) {
          targetOperator.remove();
        } else {
          // 单个条件被删完了，操作节点不可以干掉，不然再添加添加不上
          const complexOperator = targetOperator.find("#operator-select");
          // 要注意删除操作的id的类名，因为这个id名是表达式id+id_的组合，不能乱设置
          this.removeComplexOperator(complexOperator);
          targetExpressionContent.remove();
        }
      } else {
        targetExpressionContent.remove();
      }

      const id = targetExpressionContent.attr("id");
      this.deleteExpressionRes(id);
    });

    // 点击select选择规则(展开ztree选项框)
    chooseRule.on("click", (e) => {
      const clickTarget = $(e.target).closest(".select-content");
      this.currentId = $(e.target).closest(".expression-content").attr("id");
      const target = clickTarget.siblings("ul.ztree");
      target.toggleClass(this.hiddenClass); // 关闭 || 打开
      // 操作之后有hidden，意为操作的本意是关闭
      if (target.hasClass(this.hiddenClass)) {
        return;
      }

      // 打开弹窗
      let tempObj = {};
      // 当前表达式值
      const currentExpression = this.getCurrentExpression(this.expressionRes);

      // rule规则类型选择不做判断
      if (clickTarget.hasClass("class-key")) {
        tempObj = this.fileds.slice(0);
        // 判断是否渲染下一个节点input
        // 清空options || init
        $.fn.zTree.init(target, this.setting, tempObj);
        return;
      }
      // 当前表达式的select值的key
      const selectValueKey = currentExpression.options_key;

      // 操作符选择
      if (clickTarget.hasClass("class-operator")) {
        tempObj = this.ztreeDecorator(
          this.typeOperators[currentExpression.type]
        );
      }
      // 值选择
      else {
        // 渲染select框的options, 还有一种可能是input框的数据，通过input.blur绑定获取数据
        // 当前选框没有数据
        if (!Object.keys(this.options).includes(selectValueKey)) {
          tempObj = Object.keys(tempObj).length ? tempObj : this.noData;
          $.fn.zTree.init(target, this.setting, tempObj);
          return;
        }
        // 有值
        else if (Object.keys(this.options).includes(selectValueKey)) {
          tempObj = this.options[selectValueKey];
        }
        // else {
        //   input框设置值，通过blur获取值设置到对象里
        //   return;
        // }
      }
      $.fn.zTree.init(target, this.setting, tempObj ?? this.noData);
    });

    this.handleInputBlur();
  }

  handleInputBlur() {
    // input框数值改变监听
    const inputBlur = $("input");
    U.initRemoveClickEvent([inputBlur]);
    inputBlur.on("blur", (e) => {
      const findExpresion = this.getCurrentExpression(this.expressionRes);
      const index = $(".input-and-range-dom input").index(e.target);
      if (Array.isArray(findExpresion.value)) {
        findExpresion.value[index] = $(e.target).val();
        return;
      }
      findExpresion.value = $(e.target).val();
    });
  }

  // 渲染最后一个输入框的类型
  renderNextInputAndSetOptions(target, currentExpression = {}) {
    $(`#${currentExpression.id} .select-tree:last`).addClass(this.hiddenClass);
    $(`#${currentExpression.id} .input-and-range-dom`).remove();

    if (currentExpression.type === "set") {
      const option = this.options[currentExpression.options_key];
      $(`#${currentExpression.id} .select-tree:last`).toggleClass(
        this.hiddenClass
      );
      if (option) {
        $.fn.zTree.init($(target), this.setting, option);
      }
      return;
    }

    // 如果是多个则需要再增加一个，如果不是区间值, 则不需要增加input
    $(`#${currentExpression.id} .select-tree:last`).after(
      this.getOtherInputType(true)
    );
    $(`#${currentExpression.id} .input-and-range-dom`).toggleClass(
      this.hiddenClass
    );
    this.handleInputBlur();
  }

  //   ztree
  handleZTreeClick(event, treeId, treeNode) {
    if (treeNode.isParent) {
      // 有子节点则展开下一级
      const zTree = $.fn.zTree.getZTreeObj(treeId);
      zTree.expandNode(treeNode);
      return;
    }

    // 无子节点则要么点击设置值，且如果是决定性节点如rule,则要为其它兄弟的节点渲染负责
    const target = $(event)[0].target;
    let findItemArr = this.getCurrentExpression(this.expressionRes);

    // 如果被点击的是rule模块，则要渲染第三个输入框的类型select | range | input
    if (
      $(event.target)
        .closest(".select-tree")
        .find(".select-content")
        .hasClass("class-key")
    ) {
      //点击原来的选项
      if (findItemArr.field === treeNode.field) {
        return;
      }

      Object.assign(findItemArr, this.clearCurrentExpression);
      // 平复现有表达式选择的值
      // 这里更改值的key
      Object.assign(findItemArr, treeNode);
      // 清空现有值，
      $(event.target)
        .closest(".expression-content")
        .find(".select-input:not(:first)")
        .text("");
      $(event.target).closest(".expression-content").find("input").val(null);
      // 设置第三方输入框类型并监听
      this.renderNextInputAndSetOptions(target, findItemArr);
      this.setInputTextAndCloseSelect(target, findItemArr);
      return;
    } else if (
      $(event.target)
        .closest(".select-tree")
        .find(".select-content")
        .hasClass("class-operator")
    ) {
      // 操作符
      // 但凡在rule里已经有的key这里都要加operator
      treeNode = this.decoratedExpressionsKey(treeNode, this.operatorPreKey);

      Object.assign(findItemArr, treeNode);
      // 多选
      if (this.rangeOperator.includes(treeNode.operator)) {
        // 如果有，则变成[]; 如果没有，空数组
        if (!Array.isArray(findItemArr.value)) {
          findItemArr.value = [];
        }
      } else {
        findItemArr.value = null;
      }
      this.renderNextInputAndSetOptions(target, findItemArr);
      this.setInputTextAndCloseSelect(target, findItemArr, this.operatorPreKey);
      return;
    }

    // 这个id对应的值已经被存入
    treeNode = this.decoratedExpressionsKey(treeNode, this.valuePreKey);
    Object.assign(findItemArr, treeNode);
    this.setInputTextAndCloseSelect(target, findItemArr, this.valuePreKey);
  }

  getCurrentExpression(expressionRes, id = null) {
    let findItemArr = null;
    for (let item of expressionRes.sub_expressions) {
      findItemArr = item.sub_expressions.filter(
        (item) => item.id === (id ?? this.currentId)
      );
      if (findItemArr.length) {
        return findItemArr[0];
      }
    }

    return findItemArr;
  }

  setInputTextAndCloseSelect(target, expression, preKey = "") {
    $(target)
      .closest(".select-tree")
      .find(".select-input")
      .text(expression[`${preKey}label`]);
    // 关闭select
    $(target).closest("ul.ztree").toggleClass(this.hiddenClass);
  }

  // 点击其他地方，收起弹窗
  handlePutAway() {
    const _this = this;
    $(document).mouseup(function (e) {
      var _con = $("ul#ztree-id"); // 设置目标区域
      if (!_con.is(e.target) && _con.has(e.target).length === 0) {
        _con.addClass(_this.hiddenClass);
      }
    });
  }

  ztreeDecorator(decoratedVar) {
    if (Array.isArray(decoratedVar)) {
      return decoratedVar.map((item) => {
        // 非数组  && 非对象
        if (!(Array.isArray(item) || item instanceof Object)) {
          return this.operatorsList.filter((op) => {
            if (op.operator === item) {
              return op;
            }
          })[0];
        }
      });
    }

    return decoratedVar;
  }

  // 获取表达式数据给到外面
  getExpressionRes(sub_expressions) {
    let sub = U.deepClone(sub_expressions);
    if (!sub.sub_expressions.length) {
      return null;
    }
    let temp = U.deepClone(sub.sub_expressions);
    let item = null;
    for (let i = 0; i < temp.length; i++) {
      item = temp[i];
      item?.sub_expressions?.map((it) => {
        if (it.sub_expressions?.length === 0) {
          delete it.sub_expressions;
        }
        return it;
      });
      if (item.sub_expressions?.length === 1) {
        temp[i] = item.sub_expressions[0];
      }
    }

    // sub.expressions多条时，操作符须得保留
    sub.sub_expressions = temp;
    return sub;
  }

  removeComplexOperator(complexOperator) {
    // 单个条件被删完了，操作节点不可以干掉，不然再添加添加不上
    // 要注意删除操作的id的类名，因为这个id名是表达式id+id_的组合，不能乱设置
    const className = complexOperator.attr("class");
    complexOperator.removeClass(className?.match(/id_(\d+)/)?.[0]); // 移除id的类
    complexOperator.addClass(this.hiddenClass);
  }

  addDecorationToExpressions(expressions) {
    // 为null时
    if (!expressions) {
      return U.deepClone(this.expressionRes);
    }
    // 只有一条数据时(没有sub_expressions)
    if (!expressions.sub_expressions?.length) {
      const decoratedExpression = U.deepClone(this.initExpressionRes);
      decoratedExpression.sub_expressions.push(
        Object.assign(U.deepClone(this.addOneExpressions), expressions)
      );
      this.expressionRes.sub_expressions = [decoratedExpression];
      return this.expressionRes;
    }

    //多条数据
    this.expressionRes.operator = expressions.operator;
    let temp = U.deepClone(expressions.sub_expressions);
    let item = null;
    for (let i = 0; i < temp.length; i++) {
      item = U.deepClone(temp[i]);
      if (!item.hasOwnProperty("sub_expressions")) {
        temp[i] = {};
        temp[i].sub_expressions = [];
        temp[i].operator = "and";
        temp[i].sub_expressions.push(item);
      }
    }
    this.expressionRes.sub_expressions = temp;
  }
  setExpressions(expressions) {
    // 装饰expressions
    this.addDecorationToExpressions(expressions);
    $(this.element)
      .find(".expression-operator .expression-container:first")
      .children()
      .remove();
    const complexOperator = $(this.element).find(
      ".expression-wrap .expression-operator.condition-single #operator-select:first"
    );
    this.removeComplexOperator(complexOperator);
    let isFirstNodeExist = false;
    for (let item of this.expressionRes.sub_expressions) {
      // 如果是第一个item，就必然要先有个壳儿
      if (!isFirstNodeExist) {
        // 为complexOperator添加this.expressionRes的父级的任一id即可
        complexOperator.addClass(item.sub_expressions[0].id); // 不removeClass(hidden), 因为length === 1 确实是隐藏的
        // 设置最外层的selectedOne

        const complexOperatorChildren = complexOperator.children();
        let index = 0;
        while (index < complexOperatorChildren.length) {
          if (
            complexOperatorChildren[index].value === this.expressionRes.operator
          ) {
            complexOperatorChildren[index].selected = true;
          }
          index++;
        }
        isFirstNodeExist = true;
      }
      if (
        item.sub_expressions.length === 1 &&
        $(".expression-wrap > .expression-operator").length
      ) {
        this.addSingleExpression(
          // parent ??
          $(this.outerConditionWrapClass),
          null,
          item
        );
      } else {
        // 添加条件组
        if (item.sub_expressions.length > 1) {
          this.addExpression(
            this.conditionGroupClass,
            this.groupWrapperOfExpressions,
            item.sub_expressions.length,
            item
          );
        }
      }
    }
    // 只有一个的时候
    this.addExpression(
      this.conditionSingleClass,
      $(this.element).children(this.expressionOuterWrapContainerClass)
    );
  }

  getValue() {
    return this.getExpressionRes(this.expressionRes);
  }

  // add-expressionRes（默认是副级）
  addExpressionRes(
    idArrOrString, // 数组 | string
    isParent = true,
    beforeSiblingId = null, // 子集的兄弟节点id
    total,
    expressionRes_sub_expression = this.expressionRes.sub_expressions,
    emptyExpressions = this.emptyExpressions,
    addOneExpressions = this.addOneExpressions
  ) {
    let id =
      typeof idArrOrString === "string" ? [idArrOrString] : idArrOrString;
    let subExpressionObj = [];
    let totalNum = total ?? (beforeSiblingId ? 1 : 2); // 子级新增两条，父级新增一条, 点击列表的增加按钮添加1条

    let isSibling = false;
    // 创建一个被新增的数组，怎么都需要的
    const emptyArr = Array(totalNum).fill(undefined);

    const copyArr = emptyArr.map((item, i) => {
      item = U.deepClone(addOneExpressions);
      item.id = id[i];
      return item;
    });

    if (isParent) {
      subExpressionObj = U.deepClone(emptyExpressions);
      subExpressionObj.sub_expressions.push(...copyArr);
      expressionRes_sub_expression.push(subExpressionObj);
      return;
    }

    // 子级
    if (beforeSiblingId) {
      // 子集但是已有子集对象，直接塞入即可，因此不需要重新建立子集对象
      for (let item of expressionRes_sub_expression) {
        // 如果找到了
        if (item.sub_expressions.length > 0) {
          // 找到item中的子节点id是beforeSiblingId的兄弟的item
          isSibling = item.sub_expressions.some(
            (it) => it.id === beforeSiblingId
          );
          if (isSibling) {
            // 拿到的对象push进应该添加的新增数组，是引用类型添加
            item.sub_expressions.push(...copyArr);
            return;
          }
        }
      }
    } else {
      subExpressionObj = U.deepClone(emptyExpressions);
    }

    subExpressionObj.sub_expressions.push(...copyArr);
    expressionRes_sub_expression.push(subExpressionObj);
  }

  // 为数据删除表达式
  deleteExpressionRes(id, expressionRes = this.expressionRes) {
    // 锁定id, 删除即可，应该用递归，虽然只有两层，因为id是必然能找到的
    for (let item of expressionRes.sub_expressions) {
      if (item.sub_expressions.length) {
        item.isSub = true;
        this.deleteExpressionRes(id, item);
      }
      // 副级且该副级没有表达式值，则这个副级就是不需要存在的
      if (item.id === id || (item.isSub && item.sub_expressions.length === 0)) {
        item.delete = true;
        break;
      }
    }
    let index = 0;
    for (let item of expressionRes.sub_expressions) {
      if (item.delete) {
        expressionRes.sub_expressions.splice(index, 1);
      }
      if (!item.isSub) {
        delete item.isSub;
      }
      delete item.delete;
      index++;
    }
  }

  getOptionsArr(options) {
    const optionsList = Object.values(options).map((item) => {
      return [...item];
    });

    const rest = [];
    optionsList.forEach((item) => {
      rest.push(...item);
    });
    return rest;
  }

  // 设置已经存在的key, 和这些key不同的可以不用加标签，否则就是要加标签的
  getNotRenameList(inputFileds = this.fileds, preKey = "fileds_") {
    const arr = [];
    let fileds = [];
    if (typeof inputFileds === "object" && !Array.isArray(inputFileds)) {
      fileds = this.getOptionsArr(inputFileds);
    } else {
      fileds = inputFileds;
    }
    fileds.map((filed) => {
      // 普通操作
      let filedKeyList = Object.keys(filed);
      filedKeyList = filedKeyList
        .map((filedKey) => {
          if (!this.existKeyList.includes(`${preKey}${filedKey}`)) {
            return `${preKey}${filedKey}`;
          }
          return null;
        })
        .filter((filedKey) => filedKey !== null);
      const isArrayList = filedKeyList.filter((filedKey) => {
        return Array.isArray(filed[filedKey.replace(preKey, "")]);
      });
      isArrayList.forEach((arrayItem) => {
        // 处理filed的值为数组时对应的模块
        filed[arrayItem.replace(preKey, "")]?.map((item) => {
          let keys = Object.keys(item);
          keys = keys.map((key) => {
            if (!this.existKeyList.includes(`${preKey}${key}`)) {
              return `${preKey}${key}`;
            }
            return null;
          });
          keys = keys.filter((key) => key !== null);
          arr.push(...keys);
        });
      });
      // 普通对象
      arr.push(...filedKeyList);
    });
    const existKeyList = new Set(arr);

    this.existKeyList.push(...Array.from(existKeyList));
  }

  // 修改传入数据的key, 以作区分
  decoratedExpressionsKey(treeNode, preKey) {
    const treeNodeKey = Object.keys(treeNode);

    // 处理在existKey中重复存在且来自不同preKey的key
    const ault = Array.from(
      new Set(this.existKeyList.map((re) => re.split("_")[1]))
    );
    this.existKeyList.forEach((item) => {
      const index = ault.findIndex((find) => find === item.split("_")[1]);
      if (index > -1) {
        ault.splice(index, 1, item);
      }
    });
    this.existKeyList = ault;
    // 更新部分实现
    treeNodeKey.map((key) => {
      if (
        !this.existKeyList.includes(`${preKey}${key}`) &&
        typeof treeNode[key] !== "function"
      ) {
        treeNode[`${preKey}${key}`] = treeNode[key];
        delete treeNode[key];
      }
    });

    return treeNode;
  }
}
