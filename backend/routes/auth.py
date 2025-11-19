from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from pydantic import BaseModel
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
import secrets

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(32)
if not os.getenv("SECRET_KEY"):
    print("WARNING: SECRET_KEY not set in environment. Using generated key for development only!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    firstName: str | None = None
    lastName: str | None = None

class UserResponse(BaseModel):
    id: str
    email: str
    firstName: str | None
    lastName: str | None
    profileImageUrl: str | None
    subscriptionPlan: str
    subscriptionStatus: str
    
    class Config:
        from_attributes = True

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = pwd_context.hash(user_data.password)
    
    # Create user
    new_user = User(
        email=user_data.email,
        password=hashed_password,
        first_name=user_data.firstName,
        last_name=user_data.lastName
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login")
async def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not pwd_context.verify(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    
    # Set cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=os.getenv("ENV") == "production",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="strict"
    )
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "profileImageUrl": user.profile_image_url,
            "subscriptionPlan": user.subscription_plan,
            "subscriptionStatus": user.subscription_status
        },
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

@router.get("/user", response_model=UserResponse)
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    # Get token from cookie
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Remove "Bearer " prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user
