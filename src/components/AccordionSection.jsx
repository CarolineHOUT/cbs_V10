import React, { useState } from "react";

export default function AccordionSection({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{marginBottom:10}}>
      <div onClick={()=>setOpen(!open)} style={{cursor:"pointer",fontWeight:600}}>
        {title}
      </div>
      {open && <div style={{marginTop:8}}>{children}</div>}
    </div>
  );
}
