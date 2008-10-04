/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

///////////////////////////////////////////////////////////////////////////////
//
VyattaNodeUI = Ext.extend(Ext.tree.TreeNodeUI,
{
    getNodeStyle: function(node)
    {
        if(node.attributes.configured == undefined)
        {
            return ' class="v-node-nocfg" style="color:black;"';
        }
        else if(node.attributes.configured == 'active')
        {
            return ' class="v-node-active" style="color:black;"';
        }
        else if(node.attributes.configured == 'set')
        {
            return ' class="v-node-set" style="color:green;"';
        }
        else if(node.attributes.configured == 'delete')
        {
            return ' class="v-node-delete" style="color:red;"';
        }

        return '';
    },

    getNodeStyleImage: function(node)
    {
        if(node == undefined) return 'active';

        switch(node.attributes.configured)
        {
            case 'set':
            case 'active':
                return '<img src="images/statusUnknown.gif"/>';
            break;
            case 'delete':
                return '<img src="images/statusDown.gif"/>';
            break;
            default:
                return '';
        }
    },

    renderElements: function(n, a, targetNode, bulkRender)
    {
        this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';
        var cb = typeof a.checked == 'boolean';
        var href = a.href ? a.href : Ext.isGecko ? "" : "#";
        var styleStr = this.getNodeStyle(n);
        var styleImg = this.getNodeStyleImage(n);
        var buf =
        [
          '<li class="x-tree-node"><div ext:tree-node-id="', n.id,
          '" class="x-tree-node-el x-tree-node-leaf x-unselectable ', a.cls,
          '" unselectable="on">',
          '<span class="x-tree-node-indent">', this.indentMarkup, "</span>",
          '<img src="', this.emptyIcon, '" class="x-tree-ec-icon x-tree-elbow" />',
          '<img src="', a.icon || this.emptyIcon, '" class="x-tree-node-icon',
          (a.icon ? " x-tree-node-inline-icon" : ""),
          (a.iconCls ? " "+a.iconCls : ""),'" unselectable="on" />',
          cb ? ('<input class="x-tree-node-cb" type="checkbox" '
                + (a.checked ? 'checked="checked" />' : '/>')) : '',
          '<a hidefocus="on" class="x-tree-node-anchor" href="', href,
          '" tabIndex="1" ',
          a.hrefTarget ? ' target="'+a.hrefTarget+'"' : "",
          '><span unselectable="on"' + styleStr + '>',
          styleImg, n.text,
          "</span></a></div>",
          '<ul class="x-tree-node-ct" style="display:none;"></ul>', "</li>"
        ].join('');

        var nel;
        if(bulkRender !== true && n.nextSibling
           && (nel = n.nextSibling.ui.getEl()))
        {
          this.wrap = Ext.DomHelper.insertHtml("beforeBegin", nel, buf);
        }
        else
        {
          this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf);
        }

        this.elNode = this.wrap.childNodes[0];
        this.ctNode = this.wrap.childNodes[1];
        var cs = this.elNode.childNodes;
        this.indentNode = cs[0];
        this.ecNode = cs[1];
        this.iconNode = cs[2];
        var index = 3;

        if(cb)
        {
          this.checkbox = cs[3];
          // fix for IE6
          this.checkbox.defaultChecked = this.checkbox.checked;
          index++;
        }

        this.anchor = cs[index];
        this.textNode = cs[index].firstChild;
    }
});

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
MyTreeLoader = Ext.extend(Ext.tree.TreeLoader,
{
    requestData: function(node, callback)
    {
        //////////////////////////////////////
        // if user is not login prompt message
        if(!f_isUserLogined(true, true))
        {
          // no sid. do nothing.
          if(typeof callback == "function")
            callback();

          return;
        }

        if(this.fireEvent("beforeload", this, node, callback) !== false)
        {
          var cstr = "<vyatta><configuration><id>";

          switch(this.g_loadMode)
          {
              case V_TREE_ID_config:
                break;
              case V_TREE_ID_oper:
                cstr = "<vyatta><configuration mode='op'><id>";
                break;
              //case V_TREE_LOAD_MODE_child:
              //default:
                //  basePath = this.baseParams.nodepath;
          }


          var xmlstr = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
                       + cstr + f_getUserLoginedID() + "</id>\n"
                       + "<node>" + this.baseParams.nodepath + "</node>\n"
                       + "</configuration></vyatta>\n";


          this.transId = Ext.Ajax.request(
          {
              method:this.requestMethod,
              url: this.dataUrl||this.url,
              success: this.handleResponse,
              failure: this.handleFailure,
              scope: this,
              argument: {callback: callback, node: node},
              //params: this.baseParams
              xmlData: xmlstr
          });

        }
        else
        {
          // if the load is cancelled, make sure we notify
          // the node that we are done
          if(typeof callback == "function")
              callback();
        }
    },

    processResponse: function(response, node, callback)
    {
        var xmlRoot = response.responseXML.documentElement;
        var q = Ext.DomQuery;

        var nodes = q.select('node', xmlRoot);
        if (nodes.length == 0)
        {
            response.responseText = '[ ]';
            return MyTreeLoader.superclass.processResponse.apply(this, arguments);
        }

        var str = '';
        for (var i = 0; i < nodes.length; i++)
        {
          if (str != '')
              str += ',';

          str += this.f_jsonGenNode(nodes[i], nodes[i].getAttribute('name'));
        }

        switch(this.g_loadMode)
        {
            case V_TREE_ID_config:
            {
              response.responseText = '[' + str + ']';
              //alert(V_TREE_ID_config + str);
              //rootNode = node.getOwnerTree().getRootNode();
              //rootNode.setText('Configuration');
              return MyTreeLoader.superclass.processResponse.apply(this, arguments);
            }
            case V_TREE_ID_oper:
            {
              var rootNode = node.getOwnerTree().getRootNode();
              rootNode.setText('Operation');
              //alert(V_TREE_ID_oper + str);
              response.responseText = '[' + str + ']';
              return MyTreeLoader.superclass.processResponse.apply(this, arguments);
            }
        }
    },

    f_jsonGenNode: function(node, nn)
    {
      if(nn == 'node.tag')
          nn = '&lt;value&gt;';

        var str = "{text:'" + nn + "',uiProvider:'node'";
        var q = Ext.DomQuery;
        var nLeaf = q.selectNode('terminal', node);

        if (nLeaf != undefined)
        {
          str += ",leaf:true";
          var nvals = q.select('value', nLeaf);
          if (nvals.length > 0)
          {
            var vstr = '';
            for (var i = 0; i < nvals.length; i++)
            {
              var cfgd = q.selectValue('configured', nvals[i], 'NONE');
              if (cfgd == 'active' || cfgd == 'set')
              {
                if (vstr != '')
                  vstr += ',';

                vstr += "'" + nvals[i].getAttribute('name') + "'";
              }
            }
                str += ",values:[ " + vstr + " ]";
          }
        }

        var nType = q.selectNode('type', node);
        if (nType != undefined)
        {
          str += ",type:'" + nType.getAttribute('name') + "'";
        }

        var nMulti = q.selectNode('multi', node);
        if (nMulti != undefined)
        {
          str += ",multi:true";
        }
        var tHelp = q.selectValue('help', node);
        if (tHelp != undefined)
        {
          tHelp = tHelp.replace(/'/g, "\\'", 'g');
          str += ",help:'" + tHelp + "'";
        }
        var tConfig = q.selectValue('configured', node);
        if (tConfig != undefined) {
          str += ",configured:'" + tConfig + "'";
        }
        var nenums = q.selectNode('enum', node);
        if (nenums != undefined)
        {
          var enums = q.select('match', nenums);
          var vstr = '';
          for (var i = 1; i <= enums.length; i++)
          {
            if (vstr != '')
            {
              vstr += ',';
            }
            vstr += "'" + q.selectValue('match:nth(' + i + ')', nenums) + "'";
          }

          str += ",enums:[ " + vstr + " ]";
        }

        str += "}";

        return str;
    }
});

/*******************************************************************************
 ///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
 *******************************************************************************/
VYATTA_tree = Ext.extend(Ext.util.Observable,
{
    ////////////////////////////////////////////////////////////////////////////
    // local var members....
    // m_parent = an object whose create it.... vyatta-panel
    // m_tree
    // m_treePanel
    // m_treeMode = V_TREE_ID_config/ V_TREE_ID_oper
    // m_treeLoader
    ////////////////////////////////////////////////////////////////////////////
    constructor: function(tabName)
    {
        this.m_treeMode = tabName;
    },

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    f_createTree: function(parent)
    {
        m_thisObj = this;
        this.m_parent = parent;

        //////////////////////////////////////////////////////////
        // create tree loader
        this.m_treeLoader = new MyTreeLoader(
        {
            clearOnLoad: true
            ,requestMethod: 'POST'
            ,dataUrl: '/cgi-bin/webgui-wrap'
            ,uiProviders:
            {
                'node': VyattaNodeUI
            }
        });
        this.m_treeLoader.g_loadMode = parent.m_tabName;

        ///////////////////////////////////////////////
        // create tree, then set tree root node
        this.m_tree = new Ext.tree.TreePanel(
        {
            bodyBorder: false
            ,border: false
            ,animate: true
            ,cls: 'vborder_less'
            ,pathSeparator: ' '
            ,rootVisible: false
            ,defaults: {autoScroll:true, bodyBorder:false}
            ,loader: this.m_treeLoader
        });

        /////////////////////////////////////////////
        // create tree panel
        this.m_treePanel = new Ext.Panel(
        {
            defaults: { autoScroll:true }
            ,items: this.m_Tree
            ,cls: 'v_tree'
        });

        ///////////////////////////////////////////////////////
        // set tree root node
        if(this.m_treeMode == V_TREE_ID_config)
        {
            this.m_tree.setRootNode(this.f_getConfigRootNode());
            this.initTreeListeners(this.m_tree, this.f_HandleNodeConfigClick);
        }
        else if(this.m_treeMode == V_TREE_ID_oper)
        {
            this.m_tree.setRootNode(this.f_getOperationRootNode());
            this.initTreeListeners(this.m_tree, this.f_handleNodeOperClick);
        }

        this.m_tree.getRootNode().expand(false, false);
    },

    f_resizeTreePanel: function(w, h)
    {
        this.m_treePanel.setSize(w-10, h-10);
        this.m_tree.setSize(w-10, h-10);
    },

    f_getNodePathStr: function(node)
    {
        var str = node.getPath('text');
        var newstr = str.replace(/^ Configuration /, '');

        return newstr;
    },

    f_getConfigRootNode: function()
    {
        var root = new Ext.tree.AsyncTreeNode(
        {
            text: 'Configuration'
            ,draggable:false // disable root node dragging
            ,cls: 'v-node-active'
            ,id:'rootNodeConfig'
        });

        return root;
    },

    f_getOperationRootNode: function()
    {
        var root = new Ext.tree.AsyncTreeNode(
        {
            text: 'Operation'
            ,draggable:false // disable root node dragging
            ,cls: 'v-node-active'
            ,id:'operNodeConfig'
        });

        return root;
    },

    initTreeListeners: function(tree, nodeClickHandler)
    {
        tree.getLoader().on('beforeload', function(loader, node)
        {
            var str = node.getPath('text');
            var path = '';

            switch(loader.g_loadMode)
            {
                case V_TREE_ID_config:
                  path = str.replace(/^ Configuration/, '');
                  loader.baseParams.nodepath = path;
                  break;
                case V_TREE_ID_oper:
                  path = str.replace(/^ Operation/, '');
                  path = path.replace('&lt;value&gt;', 'node.tag', 'g');
                  loader.baseParams.nodepath = path;
                  break;
            }
        });

        tree.on('beforeexpandnode', function(node, deep, anim)
        {
            ///////////////////////////////////////////
            // avoid to reload again on root configuration.
            if(node.getPath('text') != ' Configuration' &&
                                    node.getPath('text') != ' Operation')
            {
                node.reload();
            }
        });

        tree.on('beforecollapsenode', function(node, deep, anim)
        {
            node.collapseChildNodes(true);
        });

        tree.on('click', nodeClickHandler);
    },

    ////////////////////////////////////////////////////////////////////////////
    // node click handler for configuration tree
    f_HandleNodeConfigClick: function(node, e, dontClear)
    {
        if(!f_isUserLogined(true, true))
        {
            window.location = g_baseSystem.m_homePage;
            return;
        }

        if(m_thisObj.m_parent.m_editorPanel == undefined)
            m_thisObj.m_parent.f_createEditorPanel();

        if(dontClear == undefined || dontClear == false)
        {
            m_thisObj.m_parent.f_cleanEditorPanel();
        }

        if(node.leaf)
        {
            if(node.attributes.multi == undefined || !node.attributes.multi)
                m_thisObj.f_leafSingleHandler(node);
            else
                m_thisObj.f_leafMultiHandler(node);
        }
        else
        {
          // non-leaf
          node.expand(false, true, function(n)
          {
              if (n.attributes.multi == undefined || !n.attributes.multi)
              {
                  m_thisObj.f_interHandler(n);
              }
              else
                  m_thisObj.f_interMultiHandler(n);
          });
        }
    },

    f_interHandler: function(node)
    {
        // do nothing for root
        if(m_thisObj.f_getNodePathStr(node) == ' Configuration')
            return;

        // allow configuring all children in edit panel
        var cnodes = node.childNodes;
        for (var i = 0; i < cnodes.length; i++)
        {
            var cnode = cnodes[i];
            if(cnode.leaf)
                m_thisObj.f_HandleNodeConfigClick(cnode, null, true);
        }

        // help string
        if (node.attributes.help != undefined)
        {
            var label = new Ext.form.Label(
            {
                text: node.attributes.help
            });
        }

        m_thisObj.m_parent.m_editorPanel.doLayout();
    },

    f_interMultiHandler: function(node)
    {
        /*
         *   all: "add" field
         *   configured-active: "delete"
         *   configured-added: "delete"
         */


        var callback = function()
        {
            f_sendConfigCLICommand([ 'set ' + m_thisObj.f_getNodePathStr(node)
                             + " '" + field.getValue() + "'"
                           ], m_thisObj, node);
        }

        alert('inter mult');
        var field = f_createTextField(undefined, 'Create ' + node.text + ' value',
                      node.attributes.help, 250, callback);
        f_addField2Panel(m_thisObj.m_parent.m_editorPanel, field, node.text);
        field = field.items.itemAt(1);

        node.getValFunc = function()
        {
            return field.getValue();
        }
        /*/
        if (node.attributes.configured != undefined
            && node.attributes.configured != 'delete') {
          editor.add(new Ext.Button({
            text: 'Delete',
            handler: function() {
              f_sendConfigCLICommand([ 'delete ' + getConfigPathStr(node) ], node);
            }
          }));
        }*/

        m_thisObj.m_parent.m_editorPanel.doLayout();
    },

    f_leafSingleHandler: function(node)
    {
        // help string
        var helpStr = node.attributes.help;

        var onBlur = function()
        {
            var isSetOrDelete = (node.getValFunc() == undefined ||
                                node.getValFunc().length == 0) ?
                                'delete ' : 'set ';

            if (node.attributes.type == undefined)
            {
                // typeless
                f_sendConfigCLICommand([ isSetOrDelete +
                              m_thisObj.f_getNodePathStr(node) ], m_thisObj,
                              node, true);
            }
            else if (node.getValFunc != undefined)
            {
                f_sendConfigCLICommand([ isSetOrDelete + m_thisObj.f_getNodePathStr(node)
                             + " '" + node.getValFunc() + "'" ],
                             m_thisObj, node, true);
            }
        }

        if (node.attributes.enums != undefined)
        {
            m_thisObj.f_leafSingleEnumHandler(node, node.attributes.enums, helpStr, onBlur);
        }
        else if (node.attributes.type == undefined)
        {
            // type-less node
            // XXX needs a handler
        }
        else if (node.attributes.type == 'bool')
        {
            m_thisObj.f_leafSingleBoolHandler(node, helpStr, onBlur);
        }
        else if (node.attributes.type == 'u32')
        {
            m_thisObj.f_leafSingleU32Handler(node, helpStr, onBlur);
        }
        else
        {   //if (node.attributes.type == 'text') {
            // XXX treat everything else as text for now
            m_thisObj.f_leafSingleTxtHandler(node, helpStr, onBlur);
        }

      m_thisObj.m_parent.m_editorPanel.doLayout();
    },

    f_leafMultiHandler: function(node)
    {
        //////////////////////////////
        // help string
        var hlabel = node.attributes.help;

        var onBlur = function()
        {
            if(node.getValsFunc != undefined)
            {
                var varr = [ ];

                /////////////////////////////////////
                //
                if(node.valuesCount != undefined && node.valuesCount > 0)
                    varr = [ 'delete ' + m_thisObj.f_getNodePathStr(node) ];

                var values = node.getValsFunc();
                var jj = (varr.length != undefined) ? varr.length : 0;

                for(var i=0; i<values.length; i++)
                {
                    varr[i+jj] = 'set ' + m_thisObj.f_getNodePathStr(node)
                                + " '" + values[i] + "'";
                }

                f_sendConfigCLICommand(varr, m_thisObj, node, true);
            }
        }

        if(node.attributes.enums != undefined)
        {
            m_thisObj.f_leafMultiEnumHandler(node, node.attributes.enums, hlabel, onBlur);
        }
        else if(node.attributes.type == 'u32')
        {
            m_thisObj.f_leafMultiU32Handler(node, hlabel, onBlur);
        }
        else
        { //if (node.attributes.type == 'text') {
            // XXX treat everything else as text for now
            m_thisObj.f_leafMultiTxtHandler(node, hlabel, onBlur);
        }

      m_thisObj.m_parent.m_editorPanel.doLayout();
    },

    ////////////////////////////////////////////////////////////////////////////
    //
    f_leafSingleTxtHandler: function(node, hlabel, callback)
    {
        var ival = undefined;

        if(node.attributes.values != undefined)
            ival = node.attributes.values[0];

        var field = f_createTextField(ival, node.text, hlabel, 250, callback);
        f_addField2Panel(m_thisObj.m_parent.m_editorPanel, field, node.txt);

        field = field.items.itemAt(1);
        node.getValFunc = function()
        {
            return field.getValue();
        }
    },

    f_leafSingleEnumHandler: function(node, values, helpStr, callback)
    {
        var ival = undefined;
        if (node.attributes.values != undefined)
            ival = node.attributes.values[0];

        var narr = filterWildcard(values);
        var isEditable = false;
        if (narr != undefined)
        {
            isEditable = true;
            values = narr;
        }

        var field1 = undefined;
        //var field2 = undefined;
        var isCheckbox = undefined;

        if(values.length == 2 && (values[0] == 'enable' || values[0] == 'disable'))
        {
            isCheckbox = true;
            field1 = f_createCheckbox(ival, node, helpStr, 250, callback);
            //field2 = f_createCheckbox(ival, node.text, helpStr, 250, callback);
        }
        else
        {
            isCheckbox = false;
            field1 = f_createCombobox(values, ival,
                      'Select a valid value...', node.text, 250,
                      helpStr, isEditable, callback);
            //field2 = f_createCombobox(values, ival,
              //        'Select a valid value...', node.text, 250,
                //      helpStr, isEditable, callback);
        }

        f_addField2Panel(m_thisObj.m_parent.m_editorPanel, field1, node.txt);

        node.getValFunc = function()
        {
            var val =  field1.items.itemAt(1).items.itemAt(0).getValue();
            if(isCheckbox)
                return (val != undefined && val) ? 'enable' : 'disable';
            else
                return (val != undefined) ? val : '';
        }
    },

    f_leafMultiEnumHandler: function(node, values, hlabel, callback)
    {
        var vala = [ ];
        var gridStore = new Ext.data.SimpleStore(
        {
            fields: [{ name: 'value' }]
        });

        gridStore.loadData(vala);
        if(node.attributes.values != undefined)
            vala = node.attributes.values;

        var GridT = Ext.data.Record.create([{ name: 'value' }]);

        var narr = filterWildcard(values);
        var doValidate = true;
        if(narr != undefined)
        {
          doValidate = false;
          values = narr;
        }

        var grid = f_createEditGrid(vala, gridStore, GridT, node.text, hlabel, 250, callback);

        f_addField2Panel(m_thisObj.m_parent.m_editorPanel, grid, node.txt);

        node.getValsFunc = function()
        {
            var ret = [ ];
            for (var i = 0; i < gridStore.getCount(); i++)
                ret[i] = gridStore.getAt(i).get('value');

            return ret;
        }
    },

    f_leafMultiU32Handler:  function(node, hlabel, callback)
    {
        var vala = [ ];
        var gridStore = new Ext.data.SimpleStore(
        {
          fields: [ { name: 'value' } ]
        });

        gridStore.loadData(vala);
        if (node.attributes.values != undefined)
        {
          vala = node.attributes.values;
        }

        var GridT = Ext.data.Record.create([{ name: 'value' }]);
        var grid = f_createEditGrid(vala, gridStore, GridT, node.text, hlabel, 250, callback);

        f_addField2Panel(m_thisObj.m_parent.m_editorPanel, grid, node.txt);

        node.getValsFunc = function()
        {
            var ret = [ ];
            for (var i = 0; i < gridStore.getCount(); i++)
            {
              ret[i] = gridStore.getAt(i).get('value');
            }

            return ret;
        }
    },

    f_leafMultiTxtHandler: function(node, hlabel, callback)
    {
        var vala = [ ];
        var gridStore = new Ext.data.SimpleStore(
        {
          fields: [ { name: 'value' } ]
        });

        gridStore.loadData(vala);
        if(node.attributes.values != undefined)
            vala = node.attributes.values;

        node.valuesCount = vala.length;

        var GridT = Ext.data.Record.create(
        [
          { name: 'value' }
        ]);

        var grid = f_createEditGrid(vala, gridStore, GridT, node.text, hlabel, 250, callback);

        f_addField2Panel(m_thisObj.m_parent.m_editorPanel, grid, node.txt);

        node.getValsFunc = function()
        {
          var ret = [ ];
          var jj = 0;
          for (var i = 0; i < gridStore.getCount(); i++)
          {
              var val = gridStore.getAt(i).get('value');
              if(val.length > 0)
                ret[jj++] = val;
          }

          return ret;
        }
    },

    f_leafSingleU32Handler: function(node, hlabel, callback)
    {
        var ival = undefined;

        if (node.attributes.values != undefined)
            ival = node.attributes.values[0];

        var field = f_createNumberField(ival, node.text, hlabel, 250, callback);
        f_addField2Panel(m_thisObj.m_parent.m_editorPanel, field, node.txt);

        field = field.items.itemAt(1);
        node.getValFunc = function()
        {
            return field.getValue();
        }
    },

    f_leafSingleBoolHandler: function(node, hlabel, callback)
    {
        m_thisObj.f_leafSingleEnumHandler(node, [ 'true', 'false' ], hlabel, callback);
    },

    ////////////////////////////////////////////////////////////////////////////
    // node click handler for operation tree
    f_handleNodeOperClick: function(node, e)
    {
        if(!f_isUserLogined(true, true))
        {
            window.location = g_baseSystem.m_homePage;
            return;
        }

        if(m_thisObj.m_parent.m_editorPanel == undefined)
            m_thisObj.m_parent.f_createEditorPanel();
        m_thisObj.m_parent.f_cleanEditorPanel();

        /////////////////////////////////////////
        // on input field blur callback function
        var inputFieldOnBlur = function()
        {
            f_sendOperationCliCommand(node, m_thisObj);
        }

        // end on blur

        ///////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////
        var str = node.getPath('text');
        var path = str.replace(/^ Operation/, '');
        path = path.replace('&lt;value&gt;', '<value>', 'g');
        var labelStr = path;

        var nodeArray = [ ];
        var labelArray = [ ];
        var nNode = node;
        while(nNode.text != 'Operation')
        {
            if (nNode.text == '&lt;value&gt;')
            {
              nodeArray.push(nNode);
              nNode = nNode.parentNode;
              continue;
            }

            labelArray.push(nNode.text);

            nNode = nNode.parentNode;
        }

        labelStr = '';
        while(labelArray.length > 0)
        {
            var c = labelArray.pop();
            if(labelStr.length > 1)
                labelStr += ' ';

            labelStr += c;
        }

        while(nodeArray.length > 0)
        {
            nNode = nodeArray.pop();
            var helpStr = undefined;

            if(nNode.attributes.help != undefined)
              helpStr = nNode.attributes.help;

            if(nNode.attributes.enums != undefined)
            {
                var values = nNode.attributes.enums;

                /* TODO: backend needs to return proper enums */
                /*var wild = filterWildcard(values);
                  var isEditable = false;
                  if (wild != undefined) {
                    isEditable = true;
                    values = wild;
                  }*/

                var field = f_createCombobox(values,
                            'Select a valuid value...', undefined,
                            labelStr, 250,
                            helpStr, true, 
                            inputFieldOnBlur);

                f_addField2Panel(m_thisObj.m_parent.m_editorPanel, field, labelStr);

                field = field.items.itemAt(1).items.itemAt(0);
                nNode.getValFunc = function()
                {
                    if(field.getValue() != undefined)
                      return field.getValue();
                }
            }
            else
            {
                var field = f_createTextField('', labelStr, helpStr,
                            250, inputFieldOnBlur);

                f_addField2Panel(m_thisObj.m_parent.m_editorPanel, field, helpStr);

                field = field.items.itemAt(1);
                nNode.getValFunc = function()
                {
                    if(field.getValue() != undefined)
                      return field.getValue();
                }
            }
        }

        g_sendCommandWait = null;
        f_sendOperationCliCommand(node, m_thisObj);
    },

    f_updateOperCmdResponse: function(headerStr, values)
    {
        var mlbl = f_createTextAreaField(headerStr, values, 600, 500);

        f_addField2Panel(m_thisObj.m_parent.m_editorPanel, mlbl, undefined);
    }
});



function filterWildcard(arr)
{
    var wc = false;
    var narr = [ ];

    for (var i = 0; i < arr.length; i++)
    {
      if (arr[i] == '*')
        wc = true;
      else
        narr[narr.length] = arr[i];
    }

    if (wc)
      return narr;
    else
      return undefined;
}

function getNodeStyleImage(node)
{
    switch(node.attributes.configured)
    {
        case 'set':
        case 'active':
            return '<img align="center" src="images/statusUnknown.gif"/>';
        break;
        case 'delete':
            return '<img align="center" src="images/statusDown.gif"/>';
        break;
        default:
            return '';
    }
}