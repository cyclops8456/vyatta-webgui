/*
 Document   : utm_confUrlEzByList.js
 Created on : Apr 01, 2009, 11:21:31 AM
 Author     : Loi.Vo
 Description:
 */
function UTM_confUrlEzByList(name, callback, busLayer)
{
    /**
     ***************************************************************************
     * id naming convention
     *    enable_all:     this.m_prefix + 'cb'
     *    rowId:          this.m_prefix + 'row_' + thisObj.m_cnt
     *    enable@row:     this.m_prefix + 'cb' + thisObj.m_cnt
     *    delete@row:     when clicked, get passed the rowId
     *    textfield@row:  this.m_prefix + 'addr_' + thisObj.m_cnt
     ****************************************************************************
     */	
    var thisObj = this;
    this.thisObjName = 'UTM_confurlEzByList';
    this.m_hdcolumns = undefined;	
	this.m_header = undefined;
    this.m_addButton = undefined;
    this.m_buttons = undefined;	
    this.m_body = undefined;
    this.m_row = 0;
	this.m_rowIdArray = null;	
    this.m_cnt = 0;
	this.m_entryList = null;
	this.m_deletedRow = null;
	this.m_addedRow = null;
	this.m_updatedRow = null;
	this.m_goBack = false;
	this.m_eventCbFunction = 'f_confUrlEzByListEventCallback';	
		
	this.m_prefix = null;			
    this.m_btnCancelId = null;
    this.m_btnApplyId = null;
    this.m_btnAddId = null;
    this.m_btnBackId = null;
    this.m_btnDeleteId = null;
	this.m_btnSaveChangeAppyCbId = 	null;
	this.m_btnSaveChangeCancelCbId = null;
	this.m_textWidth = null;
    
    /**
     * @param name - name of configuration screens.
     * @param callback - a container callback
     * @param busLayer - business object
     */
    this.constructor = function(name, callback, busLayer)
    {
        this.privateConstructor(name, callback, busLayer);
    }
    
    this.privateConstructor = function(name, callback, busLayer)
    {
        UTM_confUrlEzByList.superclass.constructor(name, callback, busLayer);
    }
    this.privateConstructor(name, callback, busLayer);
    
    /////////////////////////////////////////////////////////////////////////////////////
	////// begin abstract function
	/////////////////////////////////////////////////////////////////////////////////////
	this.f_initProperties = function() {}
    this.f_init = function() {}	
    this.f_createHdColumns = function() {}	
	this.f_setEntryList = function(entryList, cb) {}
	this.f_getEntryList = function(cb) {}
    this.f_loadVMData = function() {}	
	this.f_deleteRowCb = function() {}
	this.f_applyCb = function() {}
	////////////////////////////////////////////////////////////////////////////////////	
    
	
    this.f_getConfigurationPage = function()
    {
        var div = this.f_getPanelDiv(this.f_init());
        this.f_loadVMData();
        return div;
    }	
	
    this.f_headerText = function()
    {
        return this.f_createGeneralDiv(g_lang.m_vpnOverviewHeader + "<br><br>");
    }
    		
    this.f_enableAll = function()
    {
        var cb = document.getElementById(this.m_prefix + 'enable_cb');		
        var s = this.m_prefix + 'cb_';
		
		for (var i=0; i < this.m_rowIdArray.length; i++) {
			var seedId = this.f_getSeedIdByRowId(this.m_rowIdArray[i]);
	        var el = document.getElementById(s + seedId);
			
			if (el != null) {
				el.checked = cb.checked;
			}		
		}			
    }
		    
	this.f_getSeedIdByRowId = function(rowId)
	{
		var prefix = this.m_prefix + 'row_';
        return rowId.substring(prefix.length, rowId.length);		
	}
			
    this.f_addRow = function()
    {
        var prefix = this.m_prefix;
		var rowId = prefix + 'row_' + this.m_cnt;
        this.m_rowIdArray.push(rowId);
				
        var addr = this.f_renderTextField(prefix + 'addr_' + this.m_cnt, '', '', this.m_textWidth);
        var cb = this.f_renderSmartCheckbox('yes', prefix + 'cb_' + this.m_cnt, '', '',
		                                   prefix + 'cb_hidden_' + this.m_cnt);
        var del = this.f_renderButton('delete', true, thisObj.m_eventCbFunction + "('" +
            this.m_btnDeleteId + "','" + rowId +
        "')", 'delete row');
        var data = [addr, cb, del];
        var bodyDiv = this.f_createGridRow(this.m_hdcolumns, data, 28, rowId);
        
        this.m_body.appendChild(bodyDiv);
        this.m_cnt++;
        this.f_adjust();
    }
        
	this.f_rowIdArrayRemoveRow = function(rowId)
	{
		var i = this.m_rowIdArray.indexOf(rowId);
		if (i >= 0) {
			this.m_rowIdArray.splice(i,1);
		}
	}	
	
	this.f_deleteRow = function(rowId)
	{
		var prefix = this.m_prefix + 'row_';
        var row = document.getElementById(rowId);
		
		if (row != null) {
			var seedId = this.f_getSeedIdByRowId(rowId);
			var text = document.getElementById(this.m_prefix + 'addr_' + seedId);
			var cbHidden = document.getElementById(this.m_prefix + 'cb_hidden_' + seedId);
			
			if (text.readOnly) {
			//need to send delete command to the server.
			    var entryList = new Array();
				var listObj = new UTM_urlFilterListObj(text.value);
				listObj.m_action = 'delete';
				if (cbHidden.checked) {
					listObj.m_status = true;
				} else {
					listObj.m_status = false;
				}				
				entryList.push(listObj);
				this.m_deletedRow = seedId;
				this.f_setEntryList(entryList, this.f_deleteRowCb); 	
				return;
			} else {
				row.parentNode.removeChild(row);
				this.f_rowIdArrayRemoveRow(prefix + seedId);				
			}
			this.f_adjust();
		}
	}
	
    this.f_apply = function()
	{
		//doing dumb iteration for now.
		var entryList = new Array();
		this.m_addedRow = new Array();
		this.m_updatedRow = new Array();
		
		for (var i = 0; i < this.m_rowIdArray.length; i++) {
			var seedId = this.f_getSeedIdByRowId(this.m_rowIdArray[i]);
			var text = document.getElementById(this.m_prefix + 'addr_' + seedId);
			var cb = document.getElementById(this.m_prefix + 'cb_' + seedId);
			var cbHidden = document.getElementById(this.m_prefix + 'cb_hidden_' + seedId);
			
			if ((text != undefined) && (text != null)) {
				if (!text.readOnly) {
					if (text.value.trim().length <= 0) {
						continue;
					}
					this.m_addedRow.push(seedId);
					
					var listObj = new UTM_urlFilterListObj(text.value);
					listObj.m_action = 'add';
					if (cb.checked) {
						listObj.m_status = true;
					} else {
						listObj.m_status = false;
					}
					entryList.push(listObj);
				} else {
					if (cb.checked != cbHidden.checked) {
					    var listObj = new UTM_urlFilterListObj(text.value);
						listObj.m_action = 'delete';
						listObj.m_status = true;
						entryList.push(listObj);
						listObj = new UTM_urlFilterListObj(text.value);
						listObj.m_action = 'add';
						if (cb.checked) {
							listObj.m_status = true;
						} else {
							listObj.m_status = false;
						}
						entryList.push(listObj);
						this.m_updatedRow.push(seedId);	
					}
				}
			}
		}
				
		if (entryList.length > 0) {
			this.f_setEntryList(entryList, this.f_applyCb);
		}
	}
    
    this.f_reset = function()
    {
        this.f_loadVMData();
    }
	
	this.f_changed = function()
	{
		var changed = false;
		
		for (var i = 0; i < this.m_rowIdArray.length; i++) {
			var seedId = this.f_getSeedIdByRowId(this.m_rowIdArray[i]);
			var text = document.getElementById(this.m_prefix + 'addr_' + seedId);
			var cb = document.getElementById(this.m_prefix + 'cb_' + seedId);
			var cbHidden = document.getElementById(this.m_prefix + 'cb_hidden_' + seedId);
			
			if ((text != undefined) && (text != null)) {
				if (!text.readOnly) {
					if (text.value.trim().length > 0) {
						changed = true;
						return changed;
					}
				} else {
					if (cb.checked != cbHidden.checked) {
						changed = true;
						return changed;
					}
				}
			}
		}
        return false;		
	}
	
	this.f_back = function()
	{
		if (this.f_changed()) {
			g_utils.f_popupMessage(g_lang.m_remindSaveChange, 'confirm', g_lang.m_info, true, 
			    this.m_eventCbFunction + "('" + this.m_btnSaveChangeAppyCbId + "')", 
				this.m_eventCbFunction + "('" + this.m_btnSaveChangeCancelCbId + "')"); 
		} else {
			g_configPanelObj.f_showPage(VYA.UTM_CONST.DOM_3_NAV_SUB_EASY_WEBF_ID);
		}  		
	}

    this.f_handleClick = function(id, obj)
    {
        if (id == this.m_btnCancelId) {
            this.f_reset();
        } else if (id == this.m_btnApplyId) {
            this.f_apply();
        } else if (id == this.m_btnAddId) {
            this.f_addRow();
        } else if (id == this.m_btnBackId) {
            this.f_back();          
        } else if (id == this.m_prefix + 'enable_cb') {
		    this.f_enableAll();	
		} else if (id == this.m_btnDeleteId) {
			this.f_deleteRow(obj);
		} else if (id == this.m_btnSaveChangeAppyCbId) {
		    this.m_goBack = true;			
		    this.f_apply();				
		} else if (id == this.m_btnSaveChangeCancelCbId) {
		    g_configPanelObj.f_showPage(VYA.UTM_CONST.DOM_3_NAV_SUB_EASY_WEBF_ID);								
		}
    }
	
	this.f_cleanup = function()
	{
        this.m_row = 0;
		this.m_rowIdArray = new Array();		
        this.m_cnt = 0;
	    this.m_entryList = null;
	    this.m_deletedRow = null;
	    this.m_addedRow = null;
	    this.m_updatedRow = null;
	    this.m_goBack = false;
		this.f_removeDivChildren(this.m_body);
	}
    
    this.f_getTableHeight = function()
    {
        var h = this.m_tableRowCounter * 28;
        return h;
    }
    
    this.f_adjust = function()
    {
        this.m_body.style.height = '';
		this.m_body.style.borderBottom = '';
        this.f_adjustDivPositionByPixel(this.m_addButton, 0);
        this.f_adjustDivPositionByPixel(this.m_buttons, 20);
        this.f_resize(20);
    }
	
    this.f_populateTable = function()
    {
        var a = this.m_entryList;
        if (a != null) {
			for (var i = 0; i < a.length; i++) {
				var prefix = this.m_prefix;
				var rowId = prefix + 'row_' + this.m_cnt;
  		        this.m_rowIdArray.push(rowId);
				
				var enable = 'yes';
				if (!a[i].m_status) {
					enable = 'no';
				}
				var addr = this.f_renderTextField(prefix + 'addr_' + this.m_cnt, a[i].m_value, '', this.m_textWidth, '', true);
				var cb = this.f_renderSmartCheckbox(enable, prefix + 'cb_' + this.m_cnt, '', '',
				                                       prefix + 'cb_hidden_' + this.m_cnt);
				var del = this.f_renderButton('delete', true, this.m_eventCbFunction + "('" +
				this.m_btnDeleteId +
				"','" +
				rowId +
				"')", 'delete row');
				var data = [addr, cb, del];
				var bodyDiv = this.f_createGridRow(this.m_hdcolumns, data, 28, rowId);
				this.m_body.appendChild(bodyDiv);
				this.m_cnt++;
			}
		}
		this.f_addRow();
        
        this.f_adjust();
    }
    
    this.f_handleGridSort = function(col)
    {
    }
    
    this.f_handleCheckboxClick = function(chkbox)
    {
    
    }
    
    this.f_stopLoadVMData = function()
    {
    }
}

UTM_extend(UTM_confUrlEzByList, UTM_confBaseObjExt);

function f_confUrlEzByListEventCallback(id, obj)
{
    g_configPanelObj.m_activeObj.f_handleClick(id, obj);
}

function f_confUrlEzByListDeleteCallback(evt)
{
    g_configPanelObj.m_activeObj.f_deleteRowCb(evt);
}

