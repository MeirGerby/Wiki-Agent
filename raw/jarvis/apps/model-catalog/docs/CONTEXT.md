# Model Catalog

The catalog of objects and the models that detect them.

## Language

### Tagging

**Tagging Class**:
A kind of thing that a model can tag, such as a vehicle or a person. Its identifier is its class name; it also has a Hebrew name.
_Avoid_: Class, tag, label, מחלקה

**Positive Tagging Class**:
A tagging class in the role of a class that the model must tag.
_Avoid_: Positive tag

**Empty-Fields Class**:
A tagging class in the role of a class that marks empty fields for the model. The same tagging class can be a positive tagging class and an empty-fields class of one model.
_Avoid_: Empty class, negative class

### Training

**Training**:
The process that makes a new model. It starts when a user creates a model.
_Avoid_: Creation task, job

**Training Model**:
A model that is still in training. It is not in the catalog yet.
_Avoid_: Pending model, placeholder model

**Mission**:
One run in the task manager, with a mission ID and a status. One training is one mission.
_Avoid_: Task, job

### Systems

**Task Manager**:
The external service that runs missions.
_Avoid_: Task mannager

**Picasso**:
The external service that owns the list of tagging classes.
_Avoid_: Piccaso
