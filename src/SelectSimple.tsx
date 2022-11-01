export default ({options,...props})=>(<select name="example" {...props}>
  {options.map((option=><option value={option}>{option}</option>))}
</select>)