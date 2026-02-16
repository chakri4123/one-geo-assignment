from pydantic import BaseModel
from typing import List, Optional, Dict

class DepthRange(BaseModel):
    from_: Optional[float] = None
    to: Optional[float] = None

class AnalyzeRequest(BaseModel):
    well: Optional[str] = None
    curves: Optional[List[str]] = None
    depthRange: Optional[DepthRange] = None

