teacss.ui.editorPanel = (function($){
    return teacss.ui.Panel.extend({},{
        init : function (options) {
            var me = this;
            var ui = teacss.ui;
            
            // left tab panel (for file tree & code)
            this.sidebarTabs = this.tabs = ui.tabPanel({});
            // right tab panel (for preview & code)
            this.contentTabs = this.tabs2 = ui.tabPanel({});
            // code tabs opened in right panel for default
            this.tabsForFiles = this.tabs2;
            
            // file tree tab
            this.filesTab = ui.panel("Files");
            this.tabs.addTab(this.filesTab);
            
            this.filePanel = ui.filePanel({
                jupload: options.jupload,
                onSelect: function (file) {
                    var tab;
                    for (var i=0;i<ui.codeTab.tabs.length;i++) {
                        if (ui.codeTab.tabs[i].options.file==file)
                            tab = ui.codeTab.tabs[i];
                    }
                    if (!tab) {
                        tab = ui.codeTab({file:file,closable:true,editorPanel:me});
                        me.tabsForFiles.addTab(tab);
                    }
                    me.tabsForFiles.selectTab(tab);
                }
            });
            this.filesTab.element.append(this.filePanel.element);
            
            // splitter to make tab panels resizable
            this.splitter = ui.splitter({ panels:[this.tabs,this.tabs2] });
            this.splitter.bind("change",function(){
                $.jStorage.set("editorPanel_splitterPos_"+location.href,this.value);
            });
            this.splitter.setValue($.jStorage.get("editorPanel_splitterPos_"+location.href,600));
            
            this.mainPanel = new ui.panel({items:[this.tabs,this.tabs2,this.splitter],margin:0});
            this.mainPanel.element.css({position:'absolute',left:0,right:0,top:27,bottom:0,'z-index':1});
            
            this.toolbar = new ui.panel({margin:0})
            this.toolbar.element
                .css({position:'absolute',left:0,right:0,top:0})
                .addClass("editorPanel-toolbar");
            
            // options combo with editor and layout options
            this.optionsCombo = new ui.optionsCombo({
                label:"Config",
                icons:{primary:'ui-icon-gear'},
                margin: 0, comboWidth: 200,
                change: $.proxy(this.updateOptions,this)
            });
            this.optionsCombo.element
                .appendTo(this.toolbar.element);
            
            this.updateOptions();
            this.loadTabs();
            
            this._super($.extend({items:[this.toolbar,this.mainPanel],margin:0},options||{}));
            this.element.css({position:'fixed',left:0,top:0,right:0,bottom:0,});
            
            this.element.appendTo("body").addClass("teacss-ui");
            
            // tabs state save
            this.bind("codeTabCreated",function(b,tab){
                setTimeout(me.saveTabs,1);
                tab.bind("close",function(){setTimeout(me.saveTabs,1)});
            });
            $(".ui-tabs").bind("tabsselect",function(){setTimeout(me.saveTabs,1)});
            $(".ui-tabs-nav").bind("sortstop",me.saveTabs);
        },
        // triggered when optionsCombo value changes
        updateOptions: function () {
            var ui = teacss.ui;
            var value = this.optionsCombo.value;
            
            // apply indent settings to CodeMirror defaults and opened editors
            CodeMirror.defaults.tabSize = value.tabSize;
            CodeMirror.defaults.indentUnit = value.tabSize;
            CodeMirror.defaults.indentWithTabs = value.useTab;
            
            for (var t=0;t<ui.codeTab.tabs.length;t++) {
                var e = ui.codeTab.tabs[t].editor;
                if (e) {
                    e.setOption("tabSize",value.tabSize);
                    e.setOption("indentUnit",value.tabSize);
                    e.setOption("indentWithTabs",value.useTab);
                }
            }             
            
            // create dynamic CSS node to reflect fontSize changes for CodeMirror
            var styles = $("#ideStyles");
            if (styles.length==0) {
                styles = $("<style>").attr({type:"text/css",id:"ideStyles"}).appendTo("head");
            }
            styles.html(".CodeMirror {font-size:"+value.fontSize+"px !important; line-height:"+(value.fontSize)+"px !important;}");
            for (var t=0;t<ui.codeTab.tabs.length;t++) {
                var e = ui.codeTab.tabs[t].editor;
                if (e) e.refresh();
            }            
            
            // select where code tabs are located
            if (value.editorLayout=="left") {
                var tabsForFiles = this.tabs;
            } else {
                var tabsForFiles = this.tabs2;
            }
            
            // move already opened code tabs to the right panel if needed
            if (this.tabsForFiles != tabsForFiles) {
                for (var t=0;t<ui.codeTab.tabs.length;t++) {
                    var tab = ui.codeTab.tabs[t];
                    tab.element.detach();
                    this.tabsForFiles.element.tabs("remove",'#'+tab.element.attr("id"));
                    tabsForFiles.addTab(tab);
                }
                this.tabsForFiles = tabsForFiles;
            }            
        },
        saveTabs: function () {
            var hash = {};
            teacss.jQuery(".ui-tabs-panel").each(function(){
                var tab = teacss.jQuery(this).data("tab");
                var id = tab.options.id;
                var active_href = $(this).parent().find("> .ui-tabs-nav .ui-tabs-selected a").attr("href");
                var selected = ("#"+id)==active_href;
                
                if (tab && tab.Class==teacss.ui.codeTab) {
                    hash[tab.options.file] = selected;
                }
            });
            teacss.jQuery.jStorage.set("editorPanel_tabs_"+location.href,hash);
        },
        loadTabs: function () {
            var me = this;
            var hash = teacss.jQuery.jStorage.get("editorPanel_tabs_"+location.href);
            if (hash) setTimeout(function () {
                for (var file in hash) {
                    var tab = new teacss.ui.codeTab({file:file,closable:true,editorPanel:me});
                    me.tabsForFiles.push(tab);
                    if (hash[file])
                        me.tabsForFiles.selectTab(tab);
                }
            },1);
        }
        
    });
})(teacss.jQuery);