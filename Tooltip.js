class Tooltip {
    constructor() {
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }
    
    show(city) {
        this.tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);

        this.tooltip.html(city)
                    .style('left', (d3.event.pageX) + 'px')
                    .style('top', (d3.event.pageY - 28) + 'px');
    }

    hide() {
        this.tooltip.style('opacity', 0);
    }
}

export default Tooltip;