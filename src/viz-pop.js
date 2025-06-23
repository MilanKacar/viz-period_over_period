looker.plugins.visualizations.add({
  id: 'viz_pop',
  label: 'Period over Period',
  options: {
    label_position: {
      type: 'string',
      label: 'Label Position',
      section: 'Style',
      display: 'select',
      values: [{ 'Above number': 'above' }, { 'Below number': 'below' }],
      default: 'above',
      order: 15,
    },
    layout_orientation: {
      type: 'string',
      label: 'Layout Orientation',
      section: 'Style',
      display: 'select',
      values: [{ Vertical: 'vertical' }, { Horizontal: 'horizontal' }],
      default: 'vertical',
      order: 16,
    },
    // Dynamic options registered at runtime
  },

  _fieldsRegistered: false,
  _currentData: null,
  _currentQueryResponse: null,
  _currentConfig: null,
  _container: null,

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .two-row-table-container { font-family: Arial; width: 100%; padding: 1em; }
        .two-row-row { display: flex; justify-content: space-around; align-items: center; border-bottom: none; }
        .two-row-cell { text-align: center; flex: 1; padding: 1em; border-left: 1px solid #ccc; }
        .two-row-cell:first-child { border-left: none; }
        .two-row-value { font-size: 2em; font-weight: bold; }
        .two-row-label { font-size: 0.9em; color: #666; }
        .delta-change { font-size: 0.9em; font-weight: bold; margin-top: 0.2em; display: block; }
        .delta-up { color: green; }
        .delta-down { color: red; }
        .delta-inverted-up { color: red; }
        .delta-inverted-down { color: green; }
        .row-divider-horizontal { border-top: 1px solid #ccc; margin: 1em 0; width: 100%; }
      </style>
      <div class="two-row-table-container"></div>
    `;
    this._fieldsRegistered = false;
    this._container = element.querySelector('.two-row-table-container');
  },

  // === COMPARISON REFRESH FUNCTION ===
  // Only updates delta colors and "positive is bad" styling
  refreshComparison: function() {
    if (!this._currentData || !this._currentQueryResponse || !this._currentConfig) return;

    const fields = [
      ...this._currentQueryResponse.fields.dimensions,
      ...this._currentQueryResponse.fields.measures,
      ...this._currentQueryResponse.fields.table_calculations,
    ];

    const firstTwoRows = this._currentData.slice(0, 2);

    fields.forEach((field, fieldIdx) => {
      const fieldName = field.name;
      
      // Type detection for numeric fields
      const fieldType = (field.type || '').toLowerCase();
      let isNumeric = fieldType === 'number' || fieldType === 'int' || fieldType === 'double' || fieldType === 'float';
      if (!isNumeric && this._currentData.length && this._currentData[0][fieldName]) {
        const testVal = this._currentData[0][fieldName].value;
        isNumeric = typeof testVal === 'number' || (!isNaN(parseFloat(testVal)) && isFinite(testVal));
      }

      if (!isNumeric) return;

      // Find the delta element for this field in row 2
      const isHorizontal = this._currentConfig.layout_orientation === 'horizontal';
      let deltaElement;

      if (isHorizontal) {
        // In horizontal layout: row2 -> cell at fieldIdx -> delta span
        const row2 = this._container.children[2]; // container has row1, divider, row2
        if (row2 && row2.children[fieldIdx]) {
          deltaElement = row2.children[fieldIdx].querySelector('.delta-change');
        }
      } else {
        // In vertical layout: column at fieldIdx -> second cell -> delta span
        const column = this._container.children[fieldIdx];
        if (column && column.children[1]) {
          deltaElement = column.children[1].querySelector('.delta-change');
        }
      }

      // Update delta styling based on "positive is bad" setting
      if (deltaElement) {
        const inverted = this._currentConfig[`pos_is_bad_${fieldName}`];
        const isPositive = deltaElement.innerHTML.includes('▲');
        
        // Remove existing delta classes
        deltaElement.classList.remove('delta-up', 'delta-down', 'delta-inverted-up', 'delta-inverted-down');
        
        // Apply new classes
        if (isPositive) {
          deltaElement.classList.add(inverted ? 'delta-inverted-up' : 'delta-up');
        } else {
          deltaElement.classList.add(inverted ? 'delta-inverted-down' : 'delta-down');
        }
      }
    });
  },

  // === STYLE REFRESH FUNCTION ===
  // Updates layout, colors, labels, and label positions
  refreshStyle: function() {
    if (!this._currentData || !this._currentQueryResponse || !this._currentConfig) return;

    // For major layout changes, do a full rebuild
    this.buildVisualization();
  },

  // === FULL VISUALIZATION BUILD ===
  buildVisualization: function() {
    if (!this._currentData || !this._currentQueryResponse || !this._currentConfig) return;

    this._container.innerHTML = '';

    const fields = [
      ...this._currentQueryResponse.fields.dimensions,
      ...this._currentQueryResponse.fields.measures,
      ...this._currentQueryResponse.fields.table_calculations,
    ];

    const isHorizontal = this._currentConfig.layout_orientation === 'horizontal';
    const firstTwoRows = this._currentData.slice(0, 2);

    const row1 = document.createElement('div');
    const row2 = document.createElement('div');
    row1.className = 'two-row-row';
    row2.className = 'two-row-row';

    fields.forEach((field) => {
      const fieldName = field.name;
      
      // Type detection for numeric fields
      const fieldType = (field.type || '').toLowerCase();
      let isNumeric = fieldType === 'number' || fieldType === 'int' || fieldType === 'double' || fieldType === 'float';
      if (!isNumeric && this._currentData.length && this._currentData[0][fieldName]) {
        const testVal = this._currentData[0][fieldName].value;
        isNumeric = typeof testVal === 'number' || (!isNaN(parseFloat(testVal)) && isFinite(testVal));
      }

      // Determine the color to use for both label and value
      const userColor = this._currentConfig[`custom_color_${fieldName}`];
      let colorToUse = '';
      if (userColor && userColor !== '') {
        colorToUse = userColor;
      } else if (this._currentData.length && this._currentData[0][fieldName] && this._currentData[0][fieldName].style && this._currentData[0][fieldName].style.color) {
        colorToUse = this._currentData[0][fieldName].style.color;
      }

      [0, 1].forEach((rowIdx) => {
        const cell = firstTwoRows[rowIdx]?.[fieldName];
        if (!cell) return;

        const value = LookerCharts.Utils.htmlForCell(cell);

        // Use custom label if set, else fallback to label_short, else label
        const customLabel = this._currentConfig[`custom_label_${fieldName}`];
        const label = (customLabel && customLabel.trim().length > 0)
          ? customLabel
          : (field.label_short || field.label);

        const cellDiv = document.createElement('div');
        cellDiv.className = 'two-row-cell';

        const valueDiv = document.createElement('div');
        valueDiv.className = 'two-row-value';
        valueDiv.innerHTML = value;

        const labelDiv = document.createElement('div');
        labelDiv.className = 'two-row-label';
        labelDiv.innerHTML = label;

        // Apply the same color to both label and value
        if (colorToUse) {
          valueDiv.style.color = colorToUse;
          labelDiv.style.color = colorToUse;
        }

        if (this._currentConfig.label_position === 'above') {
          cellDiv.appendChild(labelDiv);
          cellDiv.appendChild(valueDiv);
        } else {
          cellDiv.appendChild(valueDiv);
          cellDiv.appendChild(labelDiv);
        }

        // Show delta ONLY if numeric and on second row
        if (rowIdx === 1 && isNumeric) {
          const first = firstTwoRows[0][fieldName];
          const second = firstTwoRows[1][fieldName];
          const firstVal = parseFloat(first?.value);
          const secondVal = parseFloat(second?.value);
          if (!isNaN(firstVal) && !isNaN(secondVal) && firstVal !== 0) {
            const change = ((secondVal - firstVal) / Math.abs(firstVal)) * 100;
            const delta = document.createElement('span');
            const inverted = this._currentConfig[`pos_is_bad_${fieldName}`];
            if (change >= 0) {
              delta.className = 'delta-change ' + (inverted ? 'delta-inverted-up' : 'delta-up');
              delta.innerHTML = `▲ ${change.toFixed(1)}%`;
            } else {
              delta.className = 'delta-change ' + (inverted ? 'delta-inverted-down' : 'delta-down');
              delta.innerHTML = `▼ ${Math.abs(change).toFixed(1)}%`;
            }
            cellDiv.appendChild(delta);
          }
        }

        if (rowIdx === 0) row1.appendChild(cellDiv);
        else row2.appendChild(cellDiv);
      });
    });

    if (isHorizontal) {
      this._container.appendChild(row1);
      const divider = document.createElement('div');
      divider.className = 'row-divider-horizontal';
      this._container.appendChild(divider);
      this._container.appendChild(row2);
    } else {
      fields.forEach((field, fIdx) => {
        const column = document.createElement('div');
        column.className = 'two-row-row';
        [0, 1].forEach((rowIdx) => {
          const cellDiv = (rowIdx === 0 ? row1 : row2).children[fIdx];
          if (cellDiv) column.appendChild(cellDiv.cloneNode(true));
        });
        this._container.appendChild(column);
      });
    }
  },

  // === DETECT WHAT CHANGED ===
  getChangedOptionTypes: function(oldConfig, newConfig) {
    const changedTypes = new Set();
    
    // Check for comparison changes
    for (const key in newConfig) {
      if (key.startsWith('pos_is_bad_') && oldConfig[key] !== newConfig[key]) {
        changedTypes.add('comparison');
      }
    }
    
    // Check for style changes
    const styleOptions = ['label_position', 'layout_orientation'];
    for (const option of styleOptions) {
      if (oldConfig[option] !== newConfig[option]) {
        changedTypes.add('style');
      }
    }
    
    // Check for custom labels and colors
    for (const key in newConfig) {
      if ((key.startsWith('custom_label_') || key.startsWith('custom_color_')) && 
          oldConfig[key] !== newConfig[key]) {
        changedTypes.add('style');
      }
    }
    
    return changedTypes;
  },

  updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
    // === Dynamic Option Registration ===
    if (!this._fieldsRegistered) {
      const fields = [
        ...queryResponse.fields.dimensions,
        ...queryResponse.fields.measures,
        ...queryResponse.fields.table_calculations,
      ];
      
      fields.forEach((field, idx) => {
        const fieldName = field.name;
        // Type detection for numeric fields
        const fieldType = (field.type || '').toLowerCase();
        let isNumeric = fieldType === 'number' || fieldType === 'int' || fieldType === 'double' || fieldType === 'float';
        if (!isNumeric && data.length && data[0][fieldName]) {
          const testVal = data[0][fieldName].value;
          isNumeric = typeof testVal === 'number' || (!isNaN(parseFloat(testVal)) && isFinite(testVal));
        }

        // Register label option for all fields
        if (!this.options[`custom_label_${fieldName}`]) {
          this.options[`custom_label_${fieldName}`] = {
            type: 'string',
            label: `Custom Label: ${field.label}`,
            section: 'Style',
            placeholder: field.label,
            default: '',
            order: 50 + idx,
          };
        }
        
        // Register color option for all fields
        if (!this.options[`custom_color_${fieldName}`]) {
          this.options[`custom_color_${fieldName}`] = {
            type: 'string',
            label: `Value Color: ${field.label}`,
            section: 'Style',
            display: 'color',
            default: '',
            order: 80 + idx,
          };
        }
        
        // Register positive is bad for numerics only
        if (isNumeric && !this.options[`pos_is_bad_${fieldName}`]) {
          this.options[`pos_is_bad_${fieldName}`] = {
            type: 'boolean',
            label: `Positive is Bad - ${field.label}`,
            section: 'Comparison',
            default: false,
            order: 100 + idx,
          };
        }
      });
      
      this._fieldsRegistered = true;
      this.trigger('registerOptions', this.options);
      // Return to allow Looker UI to update, will re-run updateAsync after
      return;
    }

    // Store current state
    const oldConfig = this._currentConfig;
    this._currentData = data;
    this._currentQueryResponse = queryResponse;
    this._currentConfig = config;

    // Determine what changed and refresh accordingly
    if (!oldConfig) {
      // First time rendering - do full build
      this.buildVisualization();
    } else {
      const changedTypes = this.getChangedOptionTypes(oldConfig, config);
      
      if (changedTypes.has('style')) {
        // Style changes require full rebuild
        this.buildVisualization();
      } else if (changedTypes.has('comparison')) {
        // Only comparison changes - just update delta colors
        this.refreshComparison();
      }
      // If no relevant changes, do nothing
    }

    doneRendering();
  },
});
