import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';

class BarChart extends Component {
    constructor(props){
        super(props);
        this.state = {
            height: "5"
        }
    }

    render() {
        const { height } = Number(this.state) ; 
        const option = {
            // responsive: true,
            bezierCurve: false,
            legend: {
                display: false
            },
            scales: {
                // xAxes: [{
                //     barPercentage: 0.6,
                //     display: false,
                // }],
                yAxes: [
                    {
                      ticks: {
                        beginAtZero: true,
                      },
                    },
                  ]
            }
        }

        return (
            <React.Fragment>
                <Line height = {height} data = {this.props.data} options={option} />
            </React.Fragment>
        );
    }
}

export default BarChart;   