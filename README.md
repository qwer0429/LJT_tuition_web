# LJT Tuition Web

西安梁家滩国际学校学费管理系统前端

## 项目简介

基于 Vue 2.x + Element UI 的学费管理系统，用于学生管理和学费计算。

## 功能模块

- **学生管理**：学生信息录入、编辑、批量导入
- **学生学费信息**：管理学生的折扣类型、支付方式、奖学金等
- **学费配置**：
  - 年级学费配置：不同年级的基础学费设置
  - 计算规则配置：折扣比例、校车费用、时间配置
- **学费计算**：按家庭计算学费，支持全年/学期两种支付方式

## 技术栈

- Vue 2.7.16
- Vue Router 3.0.6
- Vuex 3.1.0
- Element UI 2.15.14
- Axios 0.18.1
- SCSS

## 项目结构

```
src/
├── api/              # API 接口
├── assets/           # 静态资源
├── components/       # 公共组件
├── icons/            # SVG 图标
├── layout/           # 布局组件
├── router/           # 路由配置
├── store/            # Vuex 状态管理
├── styles/           # 全局样式
├── utils/            # 工具函数
├── views/            # 页面视图
│   ├── student/          # 学生管理
│   ├── studentTuition/   # 学生学费信息
│   └── tuitionConfig/    # 学费配置
│       ├── grade.vue         # 年级配置
│       ├── calculation.vue   # 计算规则
│       └── calculationResult.vue  # 学费计算
├── App.vue
└── main.js
```

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
npm run dev
```

访问 http://localhost:9528

## 生产构建

```bash
npm run build:prod
```

## 后端接口

对接 LJThospay 后端项目，基础路径为 `/sljt`

主要接口：
- `/sljt/students/` - 学生管理
- `/sljt/studenttuitioninfo/` - 学生学费信息
- `/sljt/gradetuitionconfig/` - 年级学费配置
- `/sljt/tuitioncalculationconfig/` - 计算规则配置
- `/sljt/tuition/calculate/` - 学费计算
- `/sljt/tuition/email/` - 邮件发送

## 浏览器支持

现代浏览器和 IE10+。

## License

MIT
