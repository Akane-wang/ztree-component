export const OPERATORS = [
  { operator: "and", label: "AND", type: "complex" },
  { operator: "or", label: "OR", type: "complex" },
  { operator: "equal", label: "等于" },
  { operator: "not_equal", label: "不等于" },
  { operator: "lt", label: "小于" },
  { operator: "lte", label: "小于等于" },
  { operator: "gt", label: "大于" },
  { operator: "gte", label: "大于等于" },
  { operator: "between", label: "区间", type: "range" },
  {
    operator: "not_between",
    label: "不在区间",
    type: "range",
  },
  { operator: "in", label: "属于任一" },
  { operator: "not_in", label: "不属于任一" },
  { operator: "sub_string", label: "不属于任一" },
  { operator: "regex", label: "匹配正则" },
];

/**
 * 字段类型与操作符的对应关系
 * 用于选择字段后，根据字段的type渲染操作符列表
 * */
export const TYPE_OPERATORS = {
  text: [
    "equal",
    "not_equal",
    "lt",
    "lte",
    "gt",
    "gte",
    "between",
    "not_between",
    "in",
    "not_in",
    "sub_string",
    "regex",
  ],
  number: [
    "equal",
    "not_equal",
    "lt",
    "lte",
    "gt",
    "gte",
    "between",
    "not_between",
    "in",
    "not_in",
    "sub_string",
    "regex",
  ],
  date: [
    "equal",
    "not_equal",
    "lt",
    "lte",
    "gt",
    "gte",
    "between",
    "not_between",
  ],
  set: ["equal", "not_equal"],
};

// 下拉框选项
export const OPTIONS = {
  article_status: [
    { value: 0, label: "审核中" },
    { value: 1, label: "审核通过" },
    { value: 2, label: "审核不通过" },
  ],
  provinces: [
    { value: "gx", label: "广西" },
    { value: "gd", label: "广东" },
    { value: "cq", label: "重庆" },
  ],
  roles: [
    { value: 1000, label: "管理员" },
    { value: 1001, label: "编辑" },
    { value: 1002, label: "负责人" },
  ],
};

/***
 *  字段列表是个树形结构，可能有上万节点
 */
export const FIELDS = [
  {
    field: "article",
    label: "文章",
    children: [
      {
        field: "article.id",
        label: "文章ID",
        type: "number",
      },
      {
        field: "article.title",
        label: "文章标题",
        type: "text",
      },
      {
        field: "article.content",
        label: "文章内容",
        type: "text",
      },
      {
        field: "article.status",
        label: "文章状态",
        type: "set",
        options_key: "article_status",
      },
      {
        field: "article.area",
        label: "地区",
        type: "set",
        options_key: "area",
      },
      {
        field: "article.create_time",
        label: "文章创建时间",
        type: "date",
        format: "Ymd", // 用于渲染 值 的输入控件，只需支持YmdHis和Ymd
      },
    ],
  },
  {
    field: "author",
    label: "作者",
    children: [
      {
        field: "author.id",
        label: "作者ID",
        type: "number",
      },
      {
        field: "author.code",
        label: "作者工号",
        type: "text",
      },
      {
        field: "author.role",
        label: "作者角色",
        children: [
          {
            field: "author.role.id",
            label: "作者角色ID",
            type: "number",
          },
          {
            field: "author.role.name",
            label: "作者角色名称",
            type: "set",
            options_key: "roles",
          },
          {
            field: "author.role.code",
            label: "作者角色编号",
            type: "text",
          },
        ],
      },
    ],
  },
  {
    field: "reviewer",
    label: "审核人",
    children: [
      {
        field: "reviewer.id",
        label: "审核人ID",
        type: "number",
      },
      {
        field: "reviewer.code",
        label: "审核人工号",
        type: "text",
      },
      {
        field: "reviewer.role",
        label: "审核人角色",
        children: [
          {
            field: "reviewer.role.id",
            label: "审核人角色ID",
            type: "number",
          },
          {
            field: "reviewer.role.name",
            label: "审核人角色名称",
            type: "set",
            options_key: "roles",
          },
          {
            field: "reviewer.role.code",
            label: "审核人角色编号",
            type: "text",
          },
        ],
      },
    ],
  },
];

/**
 * 表达式：文章id=1001
 * 渲染为
 *  - 字段：文章ID
 *  - 操作符：等于
 *  - 值：文本输入框1001
 * */
const EXPRESSION_1 = {
  operator: "equal",
  field: "article.id",
  label: "文章ID",
  value: 1001,
};

/**
 * 表达式：文章创建时间为 2023-01-23  ~ 2023-04-05
 * 渲染为
 *  - 字段：文章创建时间
 *  - 操作符：区间
 *  - 值：日期范围选择器
 */
const EXPRESSION_2 = {
  operator: "between",
  field: "article.create_time",
  label: "文章创建时间",
  value: ["2023-01-23", "2023-04-05"],
};

/**
 * 表达式：文章创建时间为 2023-01-23
 * 渲染为
 *  - 字段：文章创建时间
 *  - 操作符：区间
 *  - 值：日期选择器
 */
const EXPRESSION_3 = {
  operator: "equal",
  field: "article.create_time",
  label: "文章创建时间",
  value: "2023-01-23",
};

/**
 * and表达式
 */
const EXPRESSION_4 = {
  operator: "and",
  sub_expressions: [
    { operator: "equal", field: "author.id", value: "1000", label: "作者" },
    {
      operator: "gte",
      field: "article.create_time",
      value: "2023-01-23",
      label: "文章创建时间",
    },
  ],
};

/**
 * and 和 or 组合的复杂表达式
 */
const EXPRESSION_5 = {
  operator: "and",
  sub_expressions: [
    { operator: "equal", field: "author.id", value: "1000", label: "作者" },
    {
      operator: "gte",
      field: "article.create_time",
      value: "2023-01-23",
      label: "文章创建时间",
    },
    {
      operator: "or",
      sub_expressions: [
        {
          operator: "equal",
          field: "author.role.name",
          value: 1000,
          label: "作者角色名称",
        },
        {
          operator: "equal",
          field: "reviewer.role.name",
          value: 1000,
          label: "审核人角色名称",
        },
      ],
    },
  ],
};
