# Period over Period visualization

Sometimes one need to compare 2 periods by using PoP visualization and to have the KPIs listed so one can track the numbers and compare it witheachother. We as a niceshops team had a problem where we had to find workourunds to display the data in the way we want. So we wanted to help people out having the same problem as we by publishing our vizualization with no cost so one can analyse the data and come to the conclusions in a try to evaluate the buisness better. 

## The problems we faced:

- If we use the regular table the resulst are small and they are not giving us the feel that we are looking at the KPIs and even if we want to display it, additional calculations are applied where we have to use table calcualtion to have a look at the increase / decrease of the given values.

![table](https://github.com/MilanKacar/viz-period_over_period/blob/main/doc/table_viz.png?raw=true)

- If we use mutliple values only one column is shown and that don't give us the best overview of the problem we are facing. Also if we want to track the changes, we have to load multiple columns in order to display it this problems occures when using [Multiple Value Visualization](https://marketplace.looker.com/marketplace/detail/viz-multiple_value).

![mult-value](https://github.com/MilanKacar/viz-period_over_period/blob/main/doc/mult-value.png?raw=true)

## Our solution:

In our csoluiton one can clearly see the KPIs that we have also there are indicators if the value grew or dropped:

In horizontal:
![mult-value-h](https://github.com/MilanKacar/viz-period_over_period/blob/main/doc/viz-1.png?raw=true)

In vertical:
![mult-value-v](https://github.com/MilanKacar/viz-period_over_period/blob/main/doc/viz-2.png?raw=true)


Vizulaization Options:
As alrady mentioned sometimes the positiv values are bad for the buissness e.g. COPS increases compared to the last month. In this case we want to place this value as red indicating this is bad for the buissnes. This makes it possible to check every active column in order to make it green (good values) or red (bad values).

![mult-value-v](https://github.com/MilanKacar/viz-period_over_period/blob/main/doc/comparioson-pos-neg.png?raw=true)


Other options are standard where we want to apply the changes to the specific columns like labels, colors or orientation of the visualization.

![mult-value-v](https://github.com/MilanKacar/viz-period_over_period/blob/main/doc/options.png?raw=true)
![mult-value-v](https://github.com/MilanKacar/viz-period_over_period/blob/main/doc/colors.png?raw=true)
