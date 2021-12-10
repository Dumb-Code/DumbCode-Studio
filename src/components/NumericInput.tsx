const NumericInput = () => { 
    return (
        <div className="bg-gray-300 dark:bg-gray-700 w-full h-8 flex flex-row pl-1">
            <p className="text-xs dark:text-white py-2 flex-grow cursor-text">132</p>
            <div className="text-gray-700 dark:text-gray-400" style={{fontSize: 8}}>
                <div className="rounded-sm m-1 mb-0 h-3 w-3 pl-0.5 border-b border-gray-300 dark:border-gray-700 cursor-pointer hover:text-gray-500">&#9650;</div>
                <div className="rounded-sm m-1 mt-0 h-3 w-3 pl-0.5 border-t border-gray-300 dark:border-gray-700 cursor-pointer hover:text-gray-500">&#9660;</div>
            </div>
        </div>
    );
}

export default NumericInput;