looker.plugins.visualizations.add({
  id: 'viz_pop',
  label: 'Period Over Period',
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
    // Custom label and color options are registered dynamically below
  },

  create: function (element, config) {
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
  },

  updateAsync: function (
    data,
    element,
    config,
    queryResponse,
    details,
    doneRendering
  ) {
    const container = element.querySelector('.two-row-table-container');
    container.innerHTML = '';

    const fields = [
      ...queryResponse.fields.dimensions,
      ...queryResponse.fields.measures,
      ...queryResponse.fields.table_calculations,
    ];

    // Register dynamic options for custom label, color, and "positive is bad"
    fields.forEach((field, index) => {
      // Custom label
      const labelOptionKey = `custom_label_${field.name}`;
      if (!this.options[labelOptionKey]) {
        this.options[labelOptionKey] = {
          type: 'string',
          label: `Custom Label: ${field.label}`,
          section: 'Style',
          placeholder: field.label,
          default: '',
          order: 50 + index,
        };
        this.trigger('registerOptions', this.options);
      }
      // Value color
      const colorOptionKey = `custom_color_${field.name}`;
      if (!this.options[colorOptionKey]) {
        this.options[colorOptionKey] = {
          type: 'string',
          label: `Value Color: ${field.label}`,
          section: 'Style',
          display: 'color',
          default: '',
          order: 80 + index,
        };
        this.trigger('registerOptions', this.options);
      }
      // Positive is bad
      const key = `pos_is_bad_${field.name}`;
      if (!this.options[key]) {
        this.options[key] = {
          type: 'boolean',
          label: `Positive is Bad - ${field.label} `,
          section: 'Comparison',
          default: false,
          order: 100 + index,
        };
        this.trigger('registerOptions', this.options);
      }
    });

    const isHorizontal = config.layout_orientation === 'horizontal';
    const firstTwoRows = data.slice(0, 2);
    const row1 = document.createElement('div');
    const row2 = document.createElement('div');
    row1.className = 'two-row-row';
    row2.className = 'two-row-row';

    fields.forEach((field) => {
      [0, 1].forEach((rowIndex) => {
        const cell = firstTwoRows[rowIndex][field.name];
        const value = LookerCharts.Utils.htmlForCell(cell);

        // Use custom label if set, else fallback to label_short, else label
        const customLabel = config[`custom_label_${field.name}`];
        const label =
          customLabel && customLabel.trim().length > 0
            ? customLabel
            : field.label_short || field.label;

        const cellDiv = document.createElement('div');
        cellDiv.className = 'two-row-cell';

        const valueDiv = document.createElement('div');
        valueDiv.className = 'two-row-value';
        valueDiv.innerHTML = value;

        // Use custom color if set, else fallback to Looker cell color
        const userColor = config[`custom_color_${field.name}`];
        if (userColor && userColor !== '') {
          valueDiv.style.color = userColor;
        } else if (cell && cell.style && cell.style.color) {
          valueDiv.style.color = cell.style.color;
        }

        const labelDiv = document.createElement('div');
        labelDiv.className = 'two-row-label';
        labelDiv.innerHTML = label;

        if (config.label_position === 'above') {
          cellDiv.appendChild(labelDiv);
          cellDiv.appendChild(valueDiv);
        } else {
          cellDiv.appendChild(valueDiv);
          cellDiv.appendChild(labelDiv);
        }

        if (rowIndex === 1) {
          const first = firstTwoRows[0][field.name];
          const second = firstTwoRows[1][field.name];
          const firstVal = parseFloat(first.value);
          const secondVal = parseFloat(second.value);
          if (!isNaN(firstVal) && !isNaN(secondVal) && firstVal !== 0) {
            const change = ((secondVal - firstVal) / firstVal) * 100;
            const delta = document.createElement('span');
            const inverted = config[`pos_is_bad_${field.name}`];
            if (change >= 0) {
              delta.className =
                'delta-change ' + (inverted ? 'delta-inverted-up' : 'delta-up');
              delta.innerHTML = `▲ ${change.toFixed(1)}%`;
            } else {
              delta.className =
                'delta-change ' +
                (inverted ? 'delta-inverted-down' : 'delta-down');
              delta.innerHTML = `▼ ${Math.abs(change).toFixed(1)}%`;
            }
            cellDiv.appendChild(delta);
          }
        }

        if (rowIndex === 0) row1.appendChild(cellDiv);
        else row2.appendChild(cellDiv);
      });
    });

    if (isHorizontal) {
      container.appendChild(row1);
      const divider = document.createElement('div');
      divider.className = 'row-divider-horizontal';
      container.appendChild(divider);
      container.appendChild(row2);
    } else {
      fields.forEach((field) => {
        const column = document.createElement('div');
        column.className = 'two-row-row';
        [0, 1].forEach((rowIndex) => {
          const cellDiv = (rowIndex === 0 ? row1 : row2).querySelector(
            `.two-row-cell:nth-child(${fields.indexOf(field) + 1})`
          );
          if (cellDiv) column.appendChild(cellDiv.cloneNode(true));
        });
        container.appendChild(column);
      });
    }

    doneRendering();
  },
});
