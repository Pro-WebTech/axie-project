import React, { Component } from "react";
import {Button} from "reactstrap";

class Button1 extends Component { 
    render(){
        return (
            <button 
                type="button"
                
                onClick = {this.props.setSortedField}
            >
            {this.props.btnText}
            </button>
        );
    }
  
}

export default Button1;