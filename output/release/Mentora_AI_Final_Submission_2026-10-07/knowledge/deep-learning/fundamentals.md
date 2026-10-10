# Deep Learning and Neural Networks

A neural network is a layered mathematical model that learns patterns by adjusting numerical weights. The input layer receives features, hidden layers transform them and the output layer produces a prediction.

Each neuron calculates a weighted sum and passes it through an activation function. ReLU is common in hidden layers, sigmoid is useful for binary probabilities and softmax converts output scores into probabilities across multiple classes.

Training starts with a forward pass that produces predictions. A loss function measures prediction error. Backpropagation computes how each weight contributed to the error, and an optimizer such as stochastic gradient descent or Adam updates the weights.

Convolutional neural networks are designed for grid-like data such as images. Recurrent networks process sequences, while transformers use attention to relate tokens across a sequence and support modern language models.

Deep models can overfit. Validation data, dropout, weight decay, data augmentation and early stopping help improve generalization. Training also requires monitoring loss, metrics, data quality and computational cost.
