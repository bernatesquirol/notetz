const Selector =  ({options,...props})=>(<select name="example" {...props}>
  {options.map((option=><option value={option}>{option}</option>))}
</select>)
export default Selector