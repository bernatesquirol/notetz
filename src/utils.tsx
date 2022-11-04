import React, { useContext, useMemo, useState } from "react"

export const autoContextProviderFactory = function<T extends object>(t:T, k: string=''){
    // eslint-disable-next-line react-hooks/rules-of-hooks
    
    const Context = React.createContext<any>(t)
    const ContextProvider = ({children, initialValue})=>{
      const [sharedState, setSharedState] = useState(initialValue||t)
      const setters = useMemo(()=>Object.fromEntries(Object.keys(t).map(k=>[`set${k[0].toUpperCase()}${k.slice(1)}`,(newStateOrFunc)=>{
        return setSharedState(state=>{
          let newValue = newStateOrFunc
          if (typeof newStateOrFunc === 'function'){
            newValue = newStateOrFunc(state[k])
          }
          return {...state, [k]:newValue}
        })
      }])),[])
      return <Context.Provider value={{...sharedState, ...setters, setContext: setSharedState}}>
        {children}
      </Context.Provider>
    }
    const useAutoContext = ()=>{
      const context = useContext(Context);
  
      if (context === undefined) {
        throw new Error("useUserContext was used outside of its Provider");
      }
  
      return context
    }
    let returnVal = {
      [`Provider`]:ContextProvider,
      [`${k}Context`]:Context,
      [`use${k}Context`]:useAutoContext,
    }
    return returnVal as any
    // return {Context, ContextProvider, 'useContext':useAutoContext, setContext: setSharedState}
  }