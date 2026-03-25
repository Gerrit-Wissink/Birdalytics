cd ai-model-test

pipenv install

python3 worker.py 2>&1 | grep -v "NNPACK"