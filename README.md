# AE Pro IO

AE Pro IO 是一个用于 After Effects 的资产管理和导出工具。它可以帮助您轻松管理项目素材,并快速导出合成。

## 技术栈

- 语言: ExtendScript (ES3/ES5)
- 运行环境: After Effects CC 2014+
- UI框架: ScriptUI
- 开发模式: ScriptUI Panel 封装模式

### 开发规范
- 使用 ES3/ES5 语法确保最大兼容性
- 遵循 Adobe ExtendScript 文档规范
- 使用 ScriptUI Panel 模式开发
- 采用模块化代码组织
- 实现环境检测与适配

### 代码结构
- 外层使用 IIFE 封装
- 分离 UI 构建和业务逻辑
- 使用面向对象的方式组织代码
- 实现配置的本地持久化
- 完善的错误处理机制

## 主要功能

### 素材同步
- 自动同步外部素材文件夹到 AE 项目
- 保持文件夹结构一致性
- 支持多个素材文件夹映射
- 自动创建对应的 AE 项目文件夹

### 快速导出
- 支持多种导出预设
- 可自定义输出路径
- 批量导出选中的合成
- 支持 ACES 工作流程

## 安装方法

1. 下载 `AeProIO.jsx` 文件
2. 将文件复制到 After Effects 的脚本文件夹:
   - Windows: `[AE安装目录]/Support Files/Scripts/ScriptUI Panels/`
   - Mac: `/Applications/Adobe After Effects [版本]/Scripts/ScriptUI Panels/`
3. 重启 After Effects
4. 在窗口菜单中找到 "AE Pro IO" 并运行

## 使用说明

### 路径映射设置

1. 点击设置按钮打开设置面板
2. 在"路径映射"部分添加映射关系:
   - AE文件夹: AE项目中的文件夹名称
   - 相对路径: 素材文件夹相对于项目根目录的路径
3. 点击"添加"保存映射

### 导出设置

1. 在设置面板的"导出设置"部分添加导出配置:
   - 配置名称: 为该配置起一个名字
   - 输出路径: 导出文件保存的位置(相对于项目根目录)
   - 输出模块: 选择导出格式和编码设置

## 默认配置

### 默认路径映射
- 01_Source -> 02_Assets/05_Footage/01_Source

### 默认导出设置
- ACES_ 422_Slog3 -> 04_Output/07_Final_Versions
- ACES_422_ SRGB -> 04_Output/07_Final_Versions
- ACES_PNG_sRGB -> 02_Assets/05_Footage/03_Image_Sequences

## 支持的文件格式

### 图片
- PSD, AI, EPS
- JPG, PNG, GIF
- TIF, TIFF

### 视频
- MP4, MOV, AVI

### 音频
- WAV, MP3
- AIF, AIFF

## 项目结构

## 注意事项

1. 首次运行时需要设置项目根目录
2. 建议使用相对路径以保持项目可移植性
3. 同步前请确保素材文件夹存在
4. 导出时请确保输出路径有写入权限

## 常见问题

Q: 为什么同步按钮不可用?  
A: 请先在设置中配置至少一个路径映射。

Q: 找不到导出的文件?  
A: 检查导出设置中的输出路径是否正确,路径是相对于项目根目录。

Q: 某些文件没有被同步?  
A: 检查文件格式是否受支持,以及文件是否可以正常打开。

## 更新日志

### v1.0.0
- 初始版本发布
- 实现基础的素材同步功能
- 实现基础的导出功能
- 添加默认配置

## 作者

[zhazhayu](https://github.com/zhazhayu)

## 贡献

欢迎提交问题和建议到 Issues 页面。 