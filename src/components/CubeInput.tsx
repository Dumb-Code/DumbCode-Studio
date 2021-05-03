import NumericInput from 'react-numeric-input';

const CubeInput = ({title}: {title: string}) => {
    return(
        <div>
            <p className="ml-1 text-gray-600 text-xs">{title}</p>
            <div className="flex flex-col p-1">
                <InputField axis="x" />
                <InputField axis="y" />
                <InputField axis="z" />
            </div>
        </div>
    )
}

const InputField = ({axis}: {axis: string}) => {
    
    let colors = ""
    switch(axis) {
        case "x": colors = "bg-red-500"; break;
        case "y": colors = "bg-green-500"; break;
        case "z": colors = "bg-lightBlue-500"; break;
        default: colors = "bg-gray-700"
    }
    
    return(
        <div className="flex flex-row mb-1 h-7">
            <div className={colors + " rounded-l px-2 text-white font-bold border-gray-900 pt-1.5 text-xs"}>
                {axis.toUpperCase()}
            </div>
            
            <NumericInput size={6} mobile={false} />
        </div>

        //position: absolute; 
        //right: 2px;  
        //width: 2.26ex;  
        //border-color: rgba(0, 0, 0, 0.1);  
        //border-style: solid;  
        //text-align: center;  
        //cursor: default;  
        //transition: all 0.1s ease 0s;  
        //background: rgba(0, 0, 0, 0.1) none repeat scroll 0% 0%;  
        //box-shadow: rgba(0, 0, 0, 0.1) -1px -1px 3px inset, rgba(255, 255, 255, 0.7) 1px 1px 3px inset;  
        //top: 2px;  
        //bottom: 50%;  
        //border-radius: 2px 2px 0px 0px;  
        //border-width: 1px 1px 0px;
    )
}

export default CubeInput;