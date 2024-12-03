//@target aftereffects
//@includepath "AeProIO/lib"

// 外层封装
(function(thisObj) {
    // 工具函数
    function isArray(obj) {
        if (!obj || typeof obj !== 'object') return false;
        if (typeof obj.length !== 'number') return false;
        if (typeof obj.splice !== 'function') return false;
        if (obj.constructor !== Array) return false;
        return true;
    }

    // 全局变量和常量定义
    var SCRIPT = {
        name: "AE Pro IO",
        version: "1.0.0",
        build: "1"
    };

    // 添加默认配置常量
    var DEFAULT_CONFIG = {
        pathMappings: [
            {
                aePath: "01_Source",
                assetPath: "02_Assets/05_Footage/01_Source"
            },
        ],
        exportSettings: [
            {
                name: "ACES_422_Slog3",
                outputPath: "04_Output/07_Final_Versions",
                outputModule: "ACES_422_Slog3"
            },
            {
                name: "ACES_422_sRGB",
                outputPath: "04_Output/07_Final_Versions",
                outputModule: "ACES_422_sRGB"
            },
            {
                name: "ACES_PNG_sRGB",
                outputPath: "02_Assets/05_Footage/03_Image_Sequences", 
                outputModule: "ACES_PNG_sRGB"
            },
            {
                name: "mp4",
                outputPath: "02_Assets/05_Footage/04_Shot", 
                outputModule: "mp4"
            }

        ]
    };

    // 环境检测与适配
    function checkEnvironment() {
        if (!(app && app.project)) {
            alert("请在 After Effects 中运行此脚本!");
            return false;
        }

        if (parseFloat(app.version) < 13.0) {
            alert("此脚本需要 After Effects CC 2014 或更高版本!");
            return false;
        }

        return true;
    }

    // UI构建函数
    function buildUI(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", SCRIPT.name);
        var res = "group{orientation:'column',\
                    mainGroup: Group{orientation:'row',alignChildren:['fill','top'],spacing:5,margins:5,\
                        btnGroup: Group{orientation:'row',alignChildren:['center','center'],spacing:5,\
                            syncBtn: IconButton{size:[25,25],style:'toolbutton'},\
                            settingsBtn: IconButton{size:[25,25],style:'toolbutton'}\
                        },\
                        exportBtnGroup: Group{orientation:'row',alignChildren:['center','top'],spacing:5}\
                    }\
                }";

        panel.grp = panel.add(res);
        
        // 设置图标
        panel.grp.mainGroup.btnGroup.syncBtn.image = File("AeProIO/icons/Counterclockwise_Arrows Button.png");
        panel.grp.mainGroup.btnGroup.settingsBtn.image = File("AeProIO/icons/Gear.png");
        
        // 添加提示
        panel.grp.mainGroup.btnGroup.syncBtn.helpTip = "同步素材";
        panel.grp.mainGroup.btnGroup.settingsBtn.helpTip = "设置路径和导出模块";

        return panel;
    }

    // 设置窗口类
    function SettingsWindow(mainWin) {
        this.window = null;
        this.mainWin = mainWin;
        this.mappingList = null;
        this.onClose = null;

        // 初始化
        this.init = function() {
            this.window = new Window("palette", "设置", undefined);
            this.createUI();
            this.updateMappingList();
            this.window.center();
        };

        // 创建UI
        this.createUI = function() {
            var win = this.window;
            var that = this;
            
            // 统一窗口设置
            win.orientation = "column";
            win.alignChildren = ["fill", "top"]; 
            win.spacing = 10;
            win.margins = 16;

            // 项目根目录显示
            var rootGroup = win.add("group");
            rootGroup.orientation = "row";
            rootGroup.alignChildren = ["left", "center"];
            rootGroup.spacing = 10;
            
            rootGroup.add("statictext", undefined, "项目根目录:");
            var rootText = rootGroup.add("edittext", undefined, this.mainWin.projectRoot);
            rootText.preferredSize = [290, 20];
            rootText.enabled = false;
            var refreshRootBtn = rootGroup.add("button", undefined, "刷新");
            refreshRootBtn.preferredSize = [60, 20];

            refreshRootBtn.onClick = function() {
                that.mainWin.detectProjectRoot();
                rootText.text = that.mainWin.projectRoot;
                alert("项目根目录刷新成功!\n当前路径: " + that.mainWin.projectRoot);
            };

            // 路径映射面板
            var mappingPanel = win.add("panel", undefined, "路径映射");
            mappingPanel.orientation = "column";
            mappingPanel.alignChildren = ["fill", "top"];
            mappingPanel.margins = 16;
            mappingPanel.spacing = 10;

            // 映射列表区域
            var mappingListGroup = mappingPanel.add("group");
            mappingListGroup.orientation = "row";
            mappingListGroup.alignChildren = ["left", "top"];
            mappingListGroup.spacing = 10;

            // 左侧列表
            this.mappingList = mappingListGroup.add("listbox", undefined, [], {
                multiselect: false
            });
            this.mappingList.preferredSize = [350, 150];

            // 右侧按钮组
            var mappingButtonsGroup = mappingListGroup.add("group");
            mappingButtonsGroup.orientation = "column";
            mappingButtonsGroup.alignChildren = ["fill", "top"];
            mappingButtonsGroup.spacing = 5;

            var moveUpBtn = mappingButtonsGroup.add("button", undefined, "↑");
            var moveDownBtn = mappingButtonsGroup.add("button", undefined, "↓");
            moveUpBtn.preferredSize = moveDownBtn.preferredSize = [30, 20];

            // 添加映射编辑区
            var editGroup = mappingPanel.add("group");
            editGroup.orientation = "column";
            editGroup.alignChildren = ["fill", "top"];
            editGroup.spacing = 10;

            // AE文件夹输入组
            var aeGroup = editGroup.add("group");
            aeGroup.orientation = "row";
            aeGroup.alignChildren = ["left", "center"];
            aeGroup.spacing = 10;

            aeGroup.add("statictext", undefined, "AE文件夹:");
            var aePathText = aeGroup.add("edittext", undefined, "");
            aePathText.preferredSize = [350, 20];

            // 资源路径输入组
            var assetGroup = editGroup.add("group");
            assetGroup.orientation = "row";
            assetGroup.alignChildren = ["left", "center"];
            assetGroup.spacing = 10;

            assetGroup.add("statictext", undefined, "相对路径:");
            var assetPathText = assetGroup.add("edittext", undefined, "");
            assetPathText.preferredSize = [290, 20];
            var assetBrowseBtn = assetGroup.add("button", undefined, "浏览...");
            assetBrowseBtn.preferredSize = [60, 20];

            // 添加/删除按钮组
            var mappingBtnGroup = mappingPanel.add("group");
            mappingBtnGroup.orientation = "row";
            mappingBtnGroup.alignChildren = ["center", "center"];
            mappingBtnGroup.spacing = 10;

            var addBtn = mappingBtnGroup.add("button", undefined, "添加");
            var deleteBtn = mappingBtnGroup.add("button", undefined, "删除");

            // 导出设置面板
            var exportPanel = win.add("panel", undefined, "导出设置");
            exportPanel.orientation = "column";
            exportPanel.alignChildren = ["fill", "top"];
            exportPanel.margins = 16;
            exportPanel.spacing = 10;

            // 导出列表区域
            var exportListGroup = exportPanel.add("group");
            exportListGroup.orientation = "row";
            exportListGroup.alignChildren = ["left", "top"];
            exportListGroup.spacing = 10;

            // 左侧列表
            exportList = exportListGroup.add("listbox", undefined, [], {
                multiselect: false
            });
            exportList.preferredSize = [350, 150];

            // 右侧按钮组
            var exportButtonsGroup = exportListGroup.add("group");
            exportButtonsGroup.orientation = "column";
            exportButtonsGroup.alignChildren = ["fill", "top"];
            exportButtonsGroup.spacing = 5;

            var moveExportUpBtn = exportButtonsGroup.add("button", undefined, "↑");
            var moveExportDownBtn = exportButtonsGroup.add("button", undefined, "↓");
            moveExportUpBtn.preferredSize = moveExportDownBtn.preferredSize = [30, 20];

            // 添加导出设置编辑区
            var exportEditGroup = exportPanel.add("group");
            exportEditGroup.orientation = "column";
            exportEditGroup.alignChildren = ["fill", "top"];
            exportEditGroup.spacing = 10;

            // 配置名称输入组
            var nameGroup = exportEditGroup.add("group");
            nameGroup.orientation = "row";
            nameGroup.alignChildren = ["left", "center"];
            nameGroup.spacing = 10;

            nameGroup.add("statictext", undefined, "配置名称:");
            var nameText = nameGroup.add("edittext", undefined, "");
            nameText.preferredSize = [350, 20];

            // 输出路径输入组
            var outputGroup = exportEditGroup.add("group");
            outputGroup.orientation = "row";
            outputGroup.alignChildren = ["left", "center"];
            outputGroup.spacing = 10;

            outputGroup.add("statictext", undefined, "输出路径:");
            var outputPathText = outputGroup.add("edittext", undefined, "");
            outputPathText.preferredSize = [290, 20];
            var outputBrowseBtn = outputGroup.add("button", undefined, "浏览...");
            outputBrowseBtn.preferredSize = [60, 20];

            // 输出模块选择组
            var moduleGroup = exportEditGroup.add("group");
            moduleGroup.orientation = "row";
            moduleGroup.alignChildren = ["left", "center"];
            moduleGroup.spacing = 10;

            moduleGroup.add("statictext", undefined, "输出模块:");
            var moduleDropdown = moduleGroup.add("dropdownlist");
            moduleDropdown.preferredSize = [350, 20];

            // 添加/删除按钮组
            var exportBtnGroup = exportPanel.add("group");
            exportBtnGroup.orientation = "row";
            exportBtnGroup.alignChildren = ["center", "center"];
            exportBtnGroup.spacing = 10;

            var addExportBtn = exportBtnGroup.add("button", undefined, "添加");
            var deleteExportBtn = exportBtnGroup.add("button", undefined, "删除");

            // 设置按钮大小
            moveUpBtn.preferredSize = moveDownBtn.preferredSize = 
            moveExportUpBtn.preferredSize = moveExportDownBtn.preferredSize = [30, 20];

            // 底部按钮组
            var bottomBtnGroup = win.add("group");
            bottomBtnGroup.orientation = "row";
            bottomBtnGroup.alignChildren = ["center", "center"];
            bottomBtnGroup.spacing = 10;

            var resetBtn = bottomBtnGroup.add("button", undefined, "恢复默认设置");
            var closeBtn = bottomBtnGroup.add("button", undefined, "关闭");
            resetBtn.preferredSize = closeBtn.preferredSize = [120, 30];

            // 事件处理
            this.mappingList.onChange = function() {
                var selected = that.mappingList.selection;
                if (selected && that.mainWin.pathMappings[selected.index]) {
                    var mapping = that.mainWin.pathMappings[selected.index];
                    aePathText.text = mapping.aePath;
                    assetPathText.text = mapping.assetPath;
                }
            };

            // 素材文件夹浏览按钮点击事件,选择文件夹后自动填充路径映射
            assetBrowseBtn.onClick = function() {
                var folder = Folder.selectDialog("请选择素材所在文件夹");
                if (folder) {
                    var assetPath = folder.fsName.replace(that.mainWin.projectRoot + "\\", "");
                    assetPathText.text = assetPath;
                    var folderName = folder.name;
                    aePathText.text = folderName;
                }
            };

            addBtn.onClick = function() {
                if (!aePathText.text || !assetPathText.text) {
                    alert("请输入AE文件夹和资源路径！");
                    return;
                }
                
                that.mainWin.pathMappings.push({
                    aePath: aePathText.text,
                    assetPath: assetPathText.text
                });
                
                that.mainWin.saveConfig();
                that.updateMappingList();
                
                aePathText.text = "";
                assetPathText.text = "";
            };

            deleteBtn.onClick = function() {
                var selected = that.mappingList.selection;
                if (!selected) {
                    alert("请先选择要删除的映射！");
                    return;
                }
                
                that.mainWin.pathMappings.splice(selected.index, 1);
                that.mainWin.saveConfig();
                that.updateMappingList();
                
                aePathText.text = "";
                assetPathText.text = "";
            };

            // 填充输出模块下拉列表
            var modules = that.mainWin.getOutputModules();
            for (var i = 0; i < modules.length; i++) {
                moduleDropdown.add("item", modules[i]);
            }
            if (moduleDropdown.items.length > 0) {
                moduleDropdown.selection = 0;
            }

            // 更新导出设置列表
            function updateExportList() {
                exportList.removeAll();
                for (var i = 0; i < that.mainWin.exportSettings.length; i++) {
                    var setting = that.mainWin.exportSettings[i];
                    exportList.add("item", setting.name + " => " + setting.outputPath);
                }
            }

            // 初始化列表
            updateExportList();

            // 导出设置事件处理
            outputBrowseBtn.onClick = function() {
                var folder = Folder.selectDialog("选择输出文件夹");
                if (folder) {
                    outputPathText.text = folder.fsName.replace(that.mainWin.projectRoot + "\\", "");
                }
            };

            // 导出列表选择变化时,更新表单显示对应的设置内容
            exportList.onChange = function() {
                var selected = exportList.selection;
                if (selected && that.mainWin.exportSettings[selected.index]) {
                    var setting = that.mainWin.exportSettings[selected.index];
                    nameText.text = setting.name;
                    outputPathText.text = setting.outputPath;
                    for (var i = 0; i < moduleDropdown.items.length; i++) {
                        if (moduleDropdown.items[i].text === setting.outputModule) {
                            moduleDropdown.selection = i;
                            break;
                        }
                    }
                }
            };

            addExportBtn.onClick = function() {
                if (!nameText.text || !outputPathText.text || !moduleDropdown.selection) {
                    alert("请输入配置名称、输出路径并选择输出模块！");
                    return;
                }

                that.mainWin.exportSettings.push({
                    name: nameText.text,
                    outputPath: outputPathText.text,
                    outputModule: moduleDropdown.selection.text
                });

                updateExportList();
                that.mainWin.saveConfig();
                
                nameText.text = "";
                outputPathText.text = "";
                if (moduleDropdown.items.length > 0) {
                    moduleDropdown.selection = 0;
                }
            };

            deleteExportBtn.onClick = function() {
                var selected = exportList.selection;
                if (!selected) {
                    alert("请先选择要删除的设置！");
                    return;
                }

                that.mainWin.exportSettings.splice(selected.index, 1);
                updateExportList();
                that.mainWin.saveConfig();
                
                nameText.text = "";
                outputPathText.text = "";
                if (moduleDropdown.items.length > 0) {
                    moduleDropdown.selection = 0;
                }
            };

            resetBtn.onClick = function() {
                if (confirm("确定要恢复默认设置吗？这将覆盖当前所有设置。")) {
                    that.mainWin.pathMappings = DEFAULT_CONFIG.pathMappings.slice();
                    that.mainWin.exportSettings = DEFAULT_CONFIG.exportSettings.slice();
                    
                    that.mainWin.saveConfig();
                    
                    that.updateMappingList();
                    updateExportList();
                    
                    aePathText.text = "";
                    assetPathText.text = "";
                    nameText.text = "";
                    outputPathText.text = "";
                    if (moduleDropdown.items.length > 0) {
                        moduleDropdown.selection = 0;
                    }
                    
                    alert("已恢复默认设置！");
                }
            };

            closeBtn.onClick = function() {
                if (that.onClose) {
                    that.onClose();
                }
                win.close();
            };

            // 映射列表的上移下移事件
            moveUpBtn.onClick = function() {
                var selected = that.mappingList.selection;
                if (!selected || selected.index === 0) return;
                
                // 交换数组中的位置
                var temp = that.mainWin.pathMappings[selected.index];
                that.mainWin.pathMappings[selected.index] = that.mainWin.pathMappings[selected.index - 1];
                that.mainWin.pathMappings[selected.index - 1] = temp;
                
                // 更新列表显示并保持当前选择
                var currentIndex = selected.index;
                that.updateMappingList();
                that.mappingList.selection = currentIndex - 1;
                that.mainWin.saveConfig();
            };

            moveDownBtn.onClick = function() {
                var selected = that.mappingList.selection;
                if (!selected || selected.index === that.mainWin.pathMappings.length - 1) return;
                
                // 交换数组中的位置
                var temp = that.mainWin.pathMappings[selected.index];
                that.mainWin.pathMappings[selected.index] = that.mainWin.pathMappings[selected.index + 1];
                that.mainWin.pathMappings[selected.index + 1] = temp;
                
                // 更新列表显示并保持当前选择
                var currentIndex = selected.index;
                that.updateMappingList();
                that.mappingList.selection = currentIndex + 1;
                that.mainWin.saveConfig();
            };

            // 导出设置的上移下移事件
            moveExportUpBtn.onClick = function() {
                var selected = exportList.selection;
                if (!selected || selected.index === 0) return;
                
                // 交换数组中的位置
                var temp = that.mainWin.exportSettings[selected.index];
                that.mainWin.exportSettings[selected.index] = that.mainWin.exportSettings[selected.index - 1];
                that.mainWin.exportSettings[selected.index - 1] = temp;
                
                // 更新列表显示并保持当前选择
                var currentIndex = selected.index;
                updateExportList();
                exportList.selection = currentIndex - 1;
                that.mainWin.saveConfig();
                that.mainWin.updateExportButtons(); // 更新主界面的导出按钮
            };

            moveExportDownBtn.onClick = function() {
                var selected = exportList.selection;
                if (!selected || selected.index === that.mainWin.exportSettings.length - 1) return;
                
                // 交换数组中的位置
                var temp = that.mainWin.exportSettings[selected.index];
                that.mainWin.exportSettings[selected.index] = that.mainWin.exportSettings[selected.index + 1];
                that.mainWin.exportSettings[selected.index + 1] = temp;
                
                // 更新列表显示并保持当前选择
                var currentIndex = selected.index;
                updateExportList();
                exportList.selection = currentIndex + 1;
                that.mainWin.saveConfig();
                that.mainWin.updateExportButtons(); // 更新主界面的导出按钮
            };
        };

        // 更新映射列表
        this.updateMappingList = function() {
            if (!this.mappingList) return;
            
            this.mappingList.removeAll();
            for (var i = 0; i < this.mainWin.pathMappings.length; i++) {
                var mapping = this.mainWin.pathMappings[i];
                this.mappingList.add("item", mapping.aePath + " => " + mapping.assetPath);
            }
        };

        // 显示窗口
        this.show = function() {
            this.updateMappingList();
            this.window.show();
        };

        this.init();
    }

    // 主程序类
    function AeProIO(thisObj) {
        this.scriptPanel = null;
        this.pathMappings = [];
        this.exportSettings = [];
        this.projectRoot = "";
        
        // 初始化
        this.init = function(thisObj) {
            if (!checkEnvironment()) return;
            
            this.scriptPanel = buildUI(thisObj);
            this.detectProjectRoot();
            this.loadConfig();
            this.bindEvents();
            this.updateExportButtons();
            
            if (this.scriptPanel instanceof Window) {
                this.scriptPanel.center();
                this.scriptPanel.show();
            }
        };
        
        // 绑定事件
        this.bindEvents = function() {
            var that = this;
            var panel = this.scriptPanel;
            
            panel.grp.mainGroup.btnGroup.syncBtn.onClick = function() {
                that.syncAssets();
            };
            
            panel.grp.mainGroup.btnGroup.settingsBtn.onClick = function() {
                that.showSettings();
            };
        };
        
        // 加载配置
        this.loadConfig = function() {
            try {
                // 使用 app.settings 存储配置
                if (app.settings.haveSetting("AeProIO", "config")) {
                    var configStr = app.settings.getSetting("AeProIO", "config");
                    $.writeln("Loading config: " + configStr);
                    
                    var config = eval("(" + configStr + ")");
                    
                    // 确保配置对象包含所需的属性
                    if (config && typeof config === 'object') {
                        this.pathMappings = isArray(config.pathMappings) ? 
                            config.pathMappings.slice() : 
                            DEFAULT_CONFIG.pathMappings.slice();
                            
                        this.exportSettings = isArray(config.exportSettings) ? 
                            config.exportSettings.slice() : 
                            DEFAULT_CONFIG.exportSettings.slice();
                    } else {
                        throw new Error("Invalid config format");
                    }
                } else {
                    // 首次运行，使用默认配置
                    $.writeln("首次运行，加载默认配置");
                    this.pathMappings = DEFAULT_CONFIG.pathMappings.slice();
                    this.exportSettings = DEFAULT_CONFIG.exportSettings.slice();
                    // 保存默认配置到本地
                    this.saveConfig();
                }
                
                $.writeln("Loaded pathMappings: " + this.pathMappings.length);
                $.writeln("Loaded exportSettings: " + this.exportSettings.length);
                
                // 添加配置验证
                this.validateConfig();
                
            } catch(err) {
                $.writeln("加载配置失败: " + err.toString());
                // 出错时使用默认配置
                $.writeln("使用默认配置");
                this.pathMappings = DEFAULT_CONFIG.pathMappings.slice();
                this.exportSettings = DEFAULT_CONFIG.exportSettings.slice();
                // 保存正确的配置
                this.saveConfig();
            }
        };
        
        // 保存配置
        this.saveConfig = function() {
            try {
                $.writeln("开始保存配置...");
                $.writeln("当前路径映射数量: " + this.pathMappings.length);
                
                var config = {
                    pathMappings: this.pathMappings,
                    exportSettings: this.exportSettings
                };
                
                var configStr = config.toSource();
                $.writeln("配置内容: " + configStr);
                
                app.settings.saveSetting("AeProIO", "config", configStr);
                $.writeln("配置保存成功");
            } catch(err) {
                $.writeln("保存配置失败: " + err.toString());
                alert("保存配置失败: " + err.toString());
            }
        };
        
        // 同步资产
        this.syncAssets = function() {
            try {
                // 获取当前项目中的所有素材
                var existingAssets = this.getProjectAssets();
                
                for (var i = 0; i < this.pathMappings.length; i++) {
                    var mapping = this.pathMappings[i];
                    var assetFolderPath = this.getAbsolutePath(mapping.assetPath);
                    $.writeln("处理文件夹: " + assetFolderPath);
                    
                    var assetFolder = new Folder(assetFolderPath);
                    if (!assetFolder.exists) {
                        alert("素材文件夹不存在：" + mapping.assetPath);
                        continue;
                    }

                    var aeFolderItem = this.ensureAEFolder(mapping.aePath);
                    if (!aeFolderItem) {
                        alert("创建AE文件夹失败：" + mapping.aePath);
                        continue;
                    }

                    var items = this.getFolderContentsWithStructure(assetFolder);
                    $.writeln("找到素材数量: " + items.length);
                    
                    // 遍历所有素材文件
                    for (var j = 0; j < items.length; j++) {
                        try {
                            var item = items[j];
                            if (item.isFolder) {
                                var relativePath = item.relativePath;
                                var aeSubFolder = this.ensureAESubFolder(aeFolderItem, relativePath);
                                if (!aeSubFolder) {
                                    $.writeln("创建子文件夹失败: " + relativePath);
                                    continue;
                                }
                            } else {
                                // 检查文件是否已经导入
                                var filePath = item.file.fsName;
                                var isImported = false;
                                
                                for (var k = 0; k < existingAssets.length; k++) {
                                    if (this.normalizePath(existingAssets[k].path) === this.normalizePath(filePath)) {
                                        isImported = true;
                                        break;
                                    }
                                }
                                
                                // 如果文件未导入，则导入
                                if (!isImported) {
                                    var targetFolder = item.parentPath ? 
                                        this.ensureAESubFolder(aeFolderItem, item.parentPath) : 
                                        aeFolderItem;
                                        
                                    if (targetFolder) {
                                        this.importFileToFolder(item.file, targetFolder);
                                        $.writeln("导入新文件: " + filePath);
                                    }
                                } else {
                                    $.writeln("文件已存在，跳过: " + filePath);
                                }
                            }
                        } catch(err) {
                            $.writeln("处理项目失败: " + (item.file ? item.file.fsName : item.relativePath));
                            $.writeln("错误: " + err.toString());
                        }
                    }
                }
                alert("素材同步完成！");
            } catch(err) {
                $.writeln("同步失败: " + err.toString());
                alert("同步失败: " + err.toString());
            }
        };
        
        // 显示设置
        this.showSettings = function() {
            var that = this; // 保存 this 引用
            this.validateConfig();
            var settingsWin = new SettingsWindow(this);
            settingsWin.onClose = function() {
                that.updateExportButtons();
            };
            settingsWin.show();
        };
        
        // 导出资产
        this.exportAssets = function(exportSetting) {
            try {
                if (!exportSetting) {
                    alert("未指定导出设置！");
                    return;
                }

                var outputFolder = new Folder(this.getAbsolutePath(exportSetting.outputPath));
                if (!outputFolder.exists) {
                    outputFolder.create();
                }

                var activeComp = app.project.activeItem;
                if (activeComp instanceof CompItem) {
                    $.writeln("发现激活的合成: " + activeComp.name);
                    this.addToRenderQueue(activeComp, outputFolder, exportSetting);
                    return;
                }

                var selectedItems = [];
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item.selected && item instanceof CompItem) {
                        selectedItems.push(item);
                    }
                }

                if (selectedItems.length === 0) {
                    alert("先选择要导出的合成！");
                    return;
                }

                for (var i = 0; i < selectedItems.length; i++) {
                    this.addToRenderQueue(selectedItems[i], outputFolder, exportSetting);
                }

                alert("已添加 " + selectedItems.length + " 个合成到渲染队列！");

            } catch(err) {
                $.writeln("导出失败: " + err.toString());
                alert("导出失败: " + err.toString());
            }
        };
        
        // 工具方法
        this.getAbsolutePath = function(relativePath) {
            if (!this.projectRoot) return relativePath;
            var path = this.projectRoot + "/" + relativePath;
            return path.replace(/\//g, "\\");
        };

        this.ensureAEFolder = function(folderPath) {
            try {
                if (!folderPath) return null;

                var folderName = folderPath.replace(/^[\/\\]+|[\/\\]+$/g, '');
                
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof FolderItem && item.name === folderName) {
                        return item;
                    }
                }
                
                var newFolder = app.project.items.addFolder(folderName);
                return newFolder;
                
            } catch(err) {
                $.writeln("创建AE文件夹失败: " + folderPath);
                $.writeln("错误详情: " + err.toString());
                return null;
            }
        };

        this.ensureAESubFolder = function(parentFolder, relativePath) {
            try {
                if (!relativePath) return parentFolder;
                
                var folders = relativePath.split("/");
                var currentFolder = parentFolder;
                
                for (var i = 0; i < folders.length; i++) {
                    var folderName = folders[i];
                    var found = false;
                    
                    for (var j = 1; j <= currentFolder.items.length; j++) {
                        var item = currentFolder.items[j];
                        if (item instanceof FolderItem && item.name === folderName) {
                            currentFolder = item;
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found) {
                        var newFolder = app.project.items.addFolder(folderName);
                        newFolder.parentFolder = currentFolder;
                        currentFolder = newFolder;
                    }
                }
                
                return currentFolder;
            } catch(err) {
                $.writeln("创建子文件夹失败: " + relativePath);
                $.writeln("错误: " + err.toString());
                return null;
            }
        };

        this.getFolderContentsWithStructure = function(folder, basePath) {
            var items = [];
            basePath = basePath || "";
            
            try {
                var files = folder.getFiles();
                
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    var relativePath = basePath ? basePath + "/" + file.name : file.name;
                    
                    if (file instanceof Folder) {
                        items.push({
                            isFolder: true,
                            relativePath: relativePath,
                            name: file.name
                        });
                        
                        var subItems = this.getFolderContentsWithStructure(file, relativePath);
                        items = items.concat(subItems);
                    } else if (file instanceof File && this.isValidMediaFile(file)) {
                        items.push({
                            isFolder: false,
                            file: file,
                            relativePath: relativePath,
                            parentPath: basePath,
                            name: file.name
                        });
                    }
                }
            } catch(err) {
                $.writeln("获取文件夹内容失败: " + folder.fsName);
                $.writeln("错误: " + err.toString());
            }
            
            return items;
        };

        this.isValidMediaFile = function(file) {
            var extension = file.name.toLowerCase().split('.').pop();
            var validExtensions = ['ai', 'eps', 'ps', 'psd', 'jpg', 'jpeg', 'png', 'gif', 'tif', 'tiff', 
                                 'mp4', 'mov', 'avi', 'wav', 'mp3', 'aif', 'aiff'];
            
            for (var i = 0; i < validExtensions.length; i++) {
                if (extension === validExtensions[i]) {
                    return true;
                }
            }
            return false;
        };

        this.importFileToFolder = function(file, folder) {
            try {
                var importOptions = new ImportOptions();
                importOptions.file = file;
                if (importOptions.canImportAs(ImportAsType.FOOTAGE)) {
                    importOptions.importAs = ImportAsType.FOOTAGE;
                    var importedItem = app.project.importFile(importOptions);
                    
                    if (folder && importedItem) {
                        importedItem.parentFolder = folder;
                    }
                }
            } catch(err) {
                $.writeln("导入文件失败: " + file.fsName + ", 错误: " + err.toString());
            }
        };

        this.addToRenderQueue = function(comp, outputFolder, exportSetting) {
            try {
                // 添加到渲染队列
                var renderQueueItem = app.project.renderQueue.items.add(comp);
                var outputModule = renderQueueItem.outputModule(1);

                // 应用输出模块模板
                outputModule.applyTemplate(exportSetting.outputModule);
                
                // 设置输出路径(不需要手动添加扩展名)
                var outputPath = outputFolder.fsName + "\\" + comp.name;
                
                outputModule.file = new File(outputPath);
                
                $.writeln("已添加合成到渲染队列: " + comp.name);
                $.writeln("输出路径: " + outputPath);
                
            } catch(err) {
                $.writeln("添加到渲染队列失败: " + err.toString());
                alert("添加到渲染队列失败: " + comp.name + "\n错误: " + err.toString());
            }
        };

        this.validateConfig = function() {
            $.writeln("\n=== 验证配置 ===");
            if (!this.pathMappings) {
                $.writeln("pathMappings 不存在，使用默认配置");
                this.pathMappings = DEFAULT_CONFIG.pathMappings.slice();
            }
            
            if (!this.exportSettings) {
                $.writeln("exportSettings 不存在，使用默认配置");
                this.exportSettings = DEFAULT_CONFIG.exportSettings.slice();
            }
            
            $.writeln("当前路径映射数量: " + this.pathMappings.length);
            $.writeln("当前导出设置数量: " + this.exportSettings.length);
            $.writeln("=== 验证配置结束 ===\n");
        };

        // 添加 updateExportButtons 方法
        this.updateExportButtons = function() {
            var exportBtnGroup = this.scriptPanel.grp.mainGroup.exportBtnGroup;
            var that = this;

            // 清除现有按钮
            while (exportBtnGroup.children.length > 0) {
                exportBtnGroup.remove(exportBtnGroup.children[0]);
            }

            // 创建新按钮
            for (var i = 0; i < this.exportSettings.length; i++) {
                var setting = this.exportSettings[i];
                var btn = exportBtnGroup.add("button", undefined, setting.name || "导出到: " + setting.outputPath);
                btn.setting = setting;
                btn.preferredSize.width = 100; // 设置按钮宽度
                
                btn.onClick = function() {
                    that.exportAssets(this.setting);
                };
            }

            if (this.exportSettings.length === 0) {
                var tipText = exportBtnGroup.add("statictext", undefined, "请在设置中添加导出配置");
                tipText.alignment = ["center", "top"];
            }

            this.scriptPanel.layout.layout(true);
        };

        // 添加 getOutputModules 方法
        this.getOutputModules = function() {
            var modules = [];
            try {
                // 创建临时合成来获取输出模块模板
                var tempComp = app.project.items.addComp("temp", 1920, 1080, 1, 1, 30);
                var tempRenderItem = app.project.renderQueue.items.add(tempComp);
                var outputModule = tempRenderItem.outputModule(1);
                
                // 获取所有可用的输出模块模板
                var templates = outputModule.templates;
                for (var i = 0; i < templates.length; i++) {
                    modules.push(templates[i]);
                }
                
                // 清理临时项目
                tempRenderItem.remove();
                tempComp.remove();
            } catch(err) {
                alert("获取输出模块失败: " + err.toString());
            }
            return modules;
        };

        // 在 AeProIO 类中添加 detectProjectRoot 方法
        this.detectProjectRoot = function() {
            try {
                if (app.project.file) {
                    var projectPath = app.project.file.parent.parent.parent.fsName;
                    this.projectRoot = projectPath;
                }
            } catch(err) {
                alert("获取项目根目录失败: " + err.toString());
            }
        };

        // 添加获取项目素材的方法
        this.getProjectAssets = function() {
            var assets = [];
            try {
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof FootageItem && item.file) {
                        assets.push({
                            name: item.name,
                            path: item.file.fsName
                        });
                    }
                }
            } catch(err) {
                alert("获取项目素材失败: " + err.toString());
            }
            return assets;
        };

        // 添加路径标准化方法
        this.normalizePath = function(path) {
            // 统一路径分隔符并转换为小写以进行比较
            return path.replace(/\//g, "\\").toLowerCase();
        };

        // 初始化实例
        this.init(thisObj);
    }

    // 启动本
    try {
        new AeProIO(thisObj);
    } catch(err) {
        alert("脚本运行错误:\n" + err.toString());
    }

})(this); 