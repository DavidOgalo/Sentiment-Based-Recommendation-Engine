from pydantic import BaseModel, Field, field_validator

class ExampleModel(BaseModel):
    name: str = Field(..., description="Name of the example")
    age: int = Field(default=0, description="Age of the example")

    @field_validator("age")
    def validate_age(cls, value):
        if value < 0:
            raise ValueError("Age must be a positive integer")
        return value
