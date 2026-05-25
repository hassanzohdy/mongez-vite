# Reinforcements

`Reinforcements` is a node js package written in `Typescript` to give a massive support for variant data like `Strings`, `Arrays`, `Objects` ... and so on.

For version 1 documentation, please visit [here](./docs/VERSION-1.md)

## Installation

`yarn add @mongez/reinforcements`

or using `npm`

`npm i @mongez/reinforcements`

## Usage

We'll cover all reinforcements utilities by type, each type and mixed types and other utilities will be covered in a separate section.

## Objects

Here is the available utilities for objects:

- [get](#getting-value-from-an-object): Get value from an object using dot notation syntax.
- [set](#setting-value-in-object): Set value to an object using dot notation syntax.
- [merge](#merging-objects-deeply): Merge objects deeply (Not shallow).
- [clone](#clone-objects): Clone an object/array using deep clone (Not shallow).
- [only](#getting-only-certain-keys-from-object): Get only the given keys from an object and return it as a new object.
- [except](#getting-all-object-except-for-certain-keys): Get all object except for certain keys and return it as a new object.
- [unset](#unset-keys-from-object): Unset keys from an object.
- [flatten](#flatten-objects): Flatten a nested object into a single level object.
- [sort](#sort-object-by-its-keys): Sort object by its keys.

### Getting value from an object

To get a value from an object using `dot.notation` syntax, you can use `get` function.

```ts
get(object: object, key: string, defaultValue?: any): any
```

Let's see an example:

```ts
import { get } from "@mongez/reinforcements";

let user = {
  id: 1,
  name: {
    first: "Hasan",
    last: "Zohdy",
  },
  address: {
    country: "Egypt",
    building: {
      number: 12,
      floor: {
        number: 3,
      },
    },
  },
};

get(user, "id"); // 1
get(user, "name"); // {first: 'Hasan', last: 'Zohdy'}
get(user, "name.first"); // Hasan
get(user, "address.country"); // Egypt
get(user, "address.building.number"); // 12
get(user, "address.building.floor.number"); // 3
```

As we can see in the previous example, we can get values from objects using **dot.notation.syntax**.

If the key is missing in the object, we may return default value instead.

```ts
get(user, "email", "no-email"); // no-email
```

### Setting value in object

This works exactly but `set(object, key, value)` will set the value to the given object, which means it won't return **a new object** but the same object.

```ts
import { set } from "@mongez/reinforcements";

let user = {
  id: 1,
  name: {
    first: "Hasan",
    last: "Zohdy",
  },
  address: {
    country: "Egypt",
    building: {
      number: 12,
      floor: {
        number: 3,
      },
    },
  },
};

set(user, "email", "hassanzohdy@gmail.com");
set(user, "address.building.floor.apartment", 36);
set(user, "job.title", "Software Engineer");
```

In the previous example, we've three different cases, first case which would not be used with `set` which is setting one level key to the given object `user`, in this case we added `email` key.

In the second scenario, we added a new nested key in `address.building.floor` object, which is `apartment`, this would be a nice case to use `set`.

The last scenario, we don't have `job` key, the function will create `job` key then set `job.title` inside it.

The final user object will be:

```json
{
  "id": 1,
  "email": "hassanzohdy@gmail.com",
  "job": {
    "title": "Software Engineer"
  },
  "name": {
    "first": "Hasan",
    "last": "Zohdy"
  },
  "address": {
    "country": "Egypt",
    "building": {
      "number": 12,
      "floor": {
        "number": 3,
        "apartment": 36
      }
    }
  }
}
```

### Merging objects deeply

To merge two objects deeply, you can use `merge` function.

```ts
import { merge } from "@mongez/reinforcements";

const user = {
  id: 1,
  name: "Hasan Zohdy",
};

const userJob = {
  job: {
    title: "Software Engineer",
    level: "Senior",
  },
};

const userWithJob = merge(user, userJob);
```

Final output:

```json
{
  "id": 1,
  "name": "Hasan Zohdy",
  "job": {
    "title": "Software Engineer",
    "level": "Senior"
  }
}
```

But why not simply using the following syntax?

```ts
const user = {
  id: 1,
  name: "Hasan Zohdy",
};

const userJob = {
  job: {
    title: "Software Engineer",
    level: "Senior",
  },
};

const userWithJob = { ...user, ...userJob };
// OR
const userWithJob = Object.assign({}, user, userJob);
```

In the previous example, that would be the proper approach as the merging depth here is simple, but let's take another example.

```ts
import { merge } from "@mongez/reinforcements";

const user = {
  id: 1,
  name: "Hasan Zohdy",
  job: {
    title: "Software Engineer",
  },
};

const userJob = {
  job: {
    level: "Senior",
  },
};

const userWithJob = merge(user, userJob);
```

The output will be:

```json
{
  "id": 1,
  "name": "Hasan Zohdy",
  "job": {
    "title": "Software Engineer",
    "level": "Senior"
  }
}
```

But when using spread syntax or `Object.assign` will give us a different value.

```ts
const user = {
  id: 1,
  name: "Hasan Zohdy",
  job: {
    title: "Software Engineer",
  },
};

const userJob = {
  job: {
    level: "Senior",
  },
};

const userWithJob = { ...user, ...userJob };
// OR
const userWithJob = Object.assign({}, user, userJob);
```

```json
{
  "id": 1,
  "name": "Hasan Zohdy",
  "job": {
    "level": "Senior"
  }
}
```

### Clone objects

You can also make a **deep copy** for the given object using `clone`

```ts
const user = {
  id: 1,
  name: {
    first: "Hasan",
  },
};

const normalClonedUser = { ...user };

normalClonedUser.name.first = "Ali";

// both will be the same as only the top level is deeply copied but nested objects are shallow copies
console.log(normalClonedUser.name.first); // Ali
console.log(user.name.first); // Ali
```

Now using `clone` method

```ts
import { clone } from "@mongez/reinforcements";

const user = {
  id: 1,
  name: {
    first: "Hasan",
  },
};

const normalClonedUser = clone(user);

cloned.name.first = "Ali";

console.log(cloned.name.first); // Ali
// Here the original object is kept untouched
console.log(user.name.first); // Hasan
```

### Getting only certain keys from object

To get a new object from the base object with only list of keys, use `only(object: object, keys: string[]): object`

```ts
import { only } from "@mongez/reinforcements";

const user = {
  id: 1,
  name: "Hasan Zohdy",
  email: "hassanzohdy@gmail.com",
  job: {
    title: "Software Engineer",
  },
  address: {
    country: "Egypt",
    building: {
      number: 12,
      floor: {
        number: 3,
      },
    },
  },
};

const simpleUserData = only(user, ["id", "name", "email"]); // {id: 1, name: 'Hasan Zohdy', email: 'hassanzohdy@gmail.com'}
```

### Getting all object except for certain keys

This is the reverse of `only`, which returns the entire object except for the given keys.

```ts
import { except } from "@mongez/reinforcements";

const user = {
  id: 1,
  name: "Hasan Zohdy",
  email: "hassanzohdy@gmail.com",
  job: {
    title: "Software Engineer",
  },
  address: {
    country: "Egypt",
    building: {
      number: 12,
      floor: {
        number: 3,
      },
    },
  },
};

const simpleUserData = except(user, ["id", "address", "email"]); // { name: 'Hasan Zohdy', email: 'hassanzohdy@gmail.com', job: {title: 'Software Engineer'}}
```

### Unset keys from object

> Added in 2.1.0

To remove certain keys from the object, use `unset(object: object, keys: string[]): object`

```ts
import { unset } from "@mongez/reinforcements";

const user = {
  id: 1,
  name: "Hasan Zohdy",
  email: "hassanzohdy@gmail.com",
  job: {
    title: "Software Engineer",
  },
  address: {
    country: "Egypt",
    building: {
      number: 12,
      floor: {
        number: 3,
      },
    },
  },
};

const unset(user, ["id", "address", "email"]); // { name: 'Hasan Zohdy', job: {title: 'Software Engineer'}}
```

> The `unset` removes the keys from the object, but it doesn't return a new object, it modifies the original object and returns it, if you want to return a new object, use `except` method.

### Flatten objects

We can flatten any big fat objects into one object, with only one dimension.

```ts
import { flatten } from "@mongez/reinforcements";

const user = {
  id: 1,
  name: "Hasan Zohdy",
  email: "hassanzohdy@gmail.com",
  job: {
    title: "Software Engineer",
  },
  address: {
    country: "Egypt",
    building: {
      number: 12,
      floor: {
        number: 3,
      },
    },
  },
};

console.log(flatten(user));
```

Output:

```json
{
  "id": 1,
  "name": "Hasan Zohdy",
  "email": "hassanzohdy@gmail.com",
  "job.title": "Software Engineer",
  "address.country": "Egypt",
  "address.building.number": 12,
  "address.building.floor.number": 3
}
```

You may set the separator by passing second argument to the function.

```ts
import { flatten } from "@mongez/reinforcements";

const user = {
  id: 1,
  name: "Hasan Zohdy",
  email: "hassanzohdy@gmail.com",
  job: {
    title: "Software Engineer",
  },
  address: {
    country: "Egypt",
    building: {
      number: 12,
      floor: {
        number: 3,
      },
    },
  },
};

console.log(flatten(user, "->"));
```

Output:

```json
{
  "id": 1,
  "name": "Hasan Zohdy",
  "email": "hassanzohdy@gmail.com",
  "job->title": "Software Engineer",
  "address->country": "Egypt",
  "address->building->number": 12,
  "address->building->floor->number": 3
}
```

If the object has an instance of class, all class members will be included in the flattened object.

```ts
import { flatten } from "@mongez/reinforcements";

class User {
  id = 1;
  name = "Hasan Zohdy";
  email = "",
  job = {
    title: "Software Engineer",
  };
  address = {
    country: "Egypt",
    building: {
      number: 12,
      floor: {
        number: 3,
      },
    },
  };
}

const user = new User();

console.log(flatten(user));
```

Output:

```json
{
  "id": 1,
  "name": "Hasan Zohdy",
  "email": "",
  "job.title": "Software Engineer",
  "address.country": "Egypt",
  "address.building.number": 12,
  "address.building.floor.number": 3
}
```

### Sort object by its keys

To sort objects based on their keys alphabets recursively use `sort(object: object, recursive: boolean = true): object` function.

```ts
import { sort } from "@mongez/reinforcements";

const user = {
  id: 1,
  name: "Hasan Zohdy",
  email: "hassanzohdy@gmail.com",
  job: {
    title: "Software Engineer",
  },
  address: {
    country: "Egypt",
    building: {
      number: 12,
      floor: {
        number: 3,
      },
    },
  },
};

console.log(sort(user));
```

Output:

```json
{
  "address": {
    "building": {
      "floor": {
        "number": 3
      },
      "number": 12
    },
    "country": "Egypt"
  },
  "email": "hassanzohdy@gmail.com",
  "id": 1,
  "job": {
    "title": "Software Engineer"
  },
  "name": "Hasan Zohdy"
}
```

To sort the object only the first level, pass the second argument as false.

```ts
import { sort } from "@mongez/reinforcements";

const user = {
  id: 1,
  name: "Hasan Zohdy",
  email: "hassanzohdy@gmail.com",
  job: {
    title: "Software Engineer",
  },
  address: {
    country: "Egypt",
    building: {
      number: 12,
      floor: {
        number: 3,
      },
    },
  },
};

console.log(sort(user, false));
```

Output:

```json
{
  "address": {
    "country": "Egypt",
    "building": {
      "number": 12,
      "floor": {
        "number": 3
      }
    }
  },
  "email": "hassanzohdy@gmail.com",
  "id": 1,
  "job": {
    "title": "Software Engineer"
  },
  "name": "Hasan Zohdy"
}
```

## Arrays

Now let's move to arrays utilities.

- [Group By](#group-by): Group array of objects by a certain key/keys.
- [Pluck](#pluck): Get an array of values from an array of objects.
- [Chunk](#chunk): Split array into chunks.
- [Count](#count): Count the number of item that contains the given key or callback.
- [Count By](#count-by): Count total occurrence of values for the given key.
- [Even](#even): Get even numbers from an array or by given key.
- [Odd](#odd): Get odd numbers from an array or by given key.
- [Even Indexes](#even-indexes): Get elements in even indexes of an array.
- [Odd Indexes](#odd-indexes): Get elements in odd indexes of an array.
- [Min](#min): Get the minimum value from an array or by given key.
- [Max](#max): Get the maximum value from an array or by given key.
- [Sum](#sum): Get the sum of all values in an array or by given key.
- [Average](#average): Get the average of all values in an array or by given key.
- [Median](#median): Get the median of all values in an array or by given key.
- [Unique](#unique): Get unique values from an array.
- [Push Unique](#push-unique): Push a value or more to an array if it doesn't exist.
- [Unshift Unique](#unshift-unique): Add a value or more to the beginning of an array if it
  doesn't exist.

### Pluck

Pluck a certain key/keys from an array of objects.

`pluck(array: any[], key?: string | string[]): any[]`

```ts
import { pluck } from "@mongez/reinforcements";

const array = [
  { name: "John", age: 20 },
  { name: "Jane", age: 25 },
  { name: "Jack", age: 30 },
];

console.log(pluck(array, "name")); // ["John", "Jane", "Jack"]
```

You may also pluck multiple keys by passing an array of keys.

```ts
import { pluck } from "@mongez/reinforcements";

const array = [
  { name: "John", age: 20, job: "developer" },
  { name: "Jane", age: 25, job: "designer" },
  { name: "Jack", age: 30, job: "manager" },
];

console.log(pluck(array, ["name", "job"])); // [{name: "John", job: "developer"}, {name: "Jane", job: "designer"}, {name: "Jack", job: "manager"}]
```

### Group By

Group an array of objects by a certain key or more.

`groupBy(array: Record<string, any>[], groupByKey: string | string[], listAs = "data"): Record<string, any>[]`

Group by a single key:

```ts
import { groupBy } from "@mongez/reinforcements";

const studentsClasses = [
  {
    id: 1,
    class: "A",
    grade: 1,
  },
  {
    id: 2,
    class: "B",
    grade: 2,
  },
  {
    id: 3,
    class: "A",
    grade: 3,
  },
  {
    id: 4,
    class: "B",
    grade: 2,
  },
  {
    id: 5,
    class: "B",
    grade: 2,
  },
  {
    id: 6,
    class: "C",
    grade: 5,
  },
];

console.log(groupBy(studentsClasses, "class"));
```

Output:

```json
[
  {
    "class": "A",
    "data": [
      {
        "id": 1,
        "class": "A",
        "grade": 1
      },
      {
        "id": 3,
        "class": "A",
        "grade": 3
      }
    ]
  },
  {
    "class": "B",
    "data": [
      {
        "id": 2,
        "class": "B",
        "grade": 2
      },
      {
        "id": 4,
        "class": "B",
        "grade": 2
      },
      {
        "id": 5,
        "class": "B",
        "grade": 2
      }
    ]
  },
  {
    "class": "C",
    "data": [
      {
        "id": 6,
        "class": "C",
        "grade": 5
      }
    ]
  }
]
```

Group By Multiple Keys:

```ts
import { groupBy } from "@mongez/reinforcements";

const studentsClasses = [
  {
    id: 1,
    class: "A",
    grade: 1,
  },
  {
    id: 2,
    class: "B",
    grade: 2,
  },
  {
    id: 3,
    class: "A",
    grade: 3,
  },
  {
    id: 4,
    class: "B",
    grade: 2,
  },
  {
    id: 5,
    class: "B",
    grade: 2,
  },
  {
    id: 6,
    class: "C",
    grade: 5,
  },
];

console.log(groupBy(studentsClasses, ["class", "grade"]));
```

Output:

```json
[
  {
    "class": "A",
    "grade": 1,
    "data": [
      {
        "id": 1,
        "class": "A",
        "grade": 1
      }
    ]
  },
  {
    "class": "A",
    "grade": 3,
    "data": [
      {
        "id": 3,
        "class": "A",
        "grade": 3
      }
    ]
  },
  {
    "class": "B",
    "grade": 2,
    "data": [
      {
        "id": 2,
        "class": "B",
        "grade": 2
      },
      {
        "id": 4,
        "class": "B",
        "grade": 2
      },
      {
        "id": 5,
        "class": "B",
        "grade": 2
      }
    ]
  },
  {
    "class": "C",
    "grade": 5,
    "data": [
      {
        "id": 6,
        "class": "C",
        "grade": 5
      }
    ]
  }
]
```

You can also change the `data` key to any other key by passing the third argument.

```ts
import { groupBy } from "@mongez/reinforcements";

const studentsClasses = [
  {
    id: 1,
    class: "A",
    grade: 1,
  },
  {
    id: 2,
    class: "B",
    grade: 2,
  },
  {
    id: 3,
    class: "A",
    grade: 3,
  },
  {
    id: 4,
    class: "B",
    grade: 2,
  },
  {
    id: 5,
    class: "B",
    grade: 2,
  },
  {
    id: 6,
    class: "C",
    grade: 5,
  },
];

console.log(groupBy(studentsClasses, ["class", "grade"], "students"));
```

Output:

```json
[
  {
    "class": "A",
    "grade": 1,
    "students": [
      {
        "id": 1,
        "class": "A",
        "grade": 1
      }
    ]
  },
  {
    "class": "A",
    "grade": 3,
    "students": [
      {
        "id": 3,
        "class": "A",
        "grade": 3
      }
    ]
  },
  {
    "class": "B",
    "grade": 2,
    "students": [
      {
        "id": 2,
        "class": "B",
        "grade": 2
      },
      {
        "id": 4,
        "class": "B",
        "grade": 2
      },
      {
        "id": 5,
        "class": "B",
        "grade": 2
      }
    ]
  },
  {
    "class": "C",
    "grade": 5,
    "students": [
      {
        "id": 6,
        "class": "C",
        "grade": 5
      }
    ]
  }
]
```

### Chunk

Split array into chunks.

`chunk(array: any[] | string, size: number): any[]`

```ts
import { chunk } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(chunk(array, 2)); // [[1, 2], [3, 4], [5]]
```

### Count

Count the number of item that contains the given key or callback.

`count(data: any[], key: string | Parameters<typeof Array.prototype.filter>[0]): number`

```ts
import { count } from "@mongez/reinforcements";

const array = [
  { id: 1, value: 1 },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  { id: 5, value: 5 },
];

console.log(count(array, "value")); // 5
```

We can also make a count using a callback.

```ts
import { count } from "@mongez/reinforcements";

const array = [
  { id: 1, value: 1 },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  { id: 5, value: 5 },
];

console.log(count(array, item => item.value > 2)); // 3
```

### Count By

Count total occurrence of values for the given key.

`countBy(array: any[], key: string): { [key: string]: number`

```ts
import { countBy } from "@mongez/reinforcements";

const array = [
  { id: 1, animal: "dog" },
  { id: 2, animal: "cat" },
  { id: 3, animal: "dog" },
  { id: 4, animal: "cat" },
  { id: 5, animal: "dog" },
];

console.log(countBy(array, "animal")); // { dog: 3, cat: 2 }
```

### Even

Get even numbers from the array or by the given key.

`even(array: any[], key?: string): any[]`

```ts
import { even } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(even(array)); // [2, 4]
```

We can also get even numbers by the given key.

```ts
import { even } from "@mongez/reinforcements";

const array = [
  { id: 1, value: 1 },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  { id: 5, value: 5 },
];

console.log(even(array, "value")); // [2, 4]
```

### Odd

Get odd numbers from the array or by the given key.

`odd(array: any[], key?: string): any[]`

```ts
import { odd } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(odd(array)); // [1, 3, 5]
```

We can also get odd numbers by the given key.

```ts
import { odd } from "@mongez/reinforcements";

const array = [
  { id: 1, value: 1 },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  { id: 5, value: 5 },
];

console.log(odd(array, "value")); // [1, 3, 5]
```

### Even Indexes

Get only array values in even indexes.

`evenIndexes(array: any[]): any[]`

```ts
import { evenIndexes } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(evenIndexes(array)); // [1, 3, 5]
```

### Odd Indexes

Get only array values in odd indexes.

`oddIndexes(array: any[]): any[]`

```ts
import { oddIndexes } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(oddIndexes(array)); // [2, 4]
```

### min

Get the minimum value from the array or by the given key.

`min(array: any[], key?: string): number`

```ts
import { min } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(min(array)); // 1
```

We can also get the minimum value by the given key.

```ts
import { min } from "@mongez/reinforcements";

const array = [
  { id: 1, value: 1 },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  { id: 5, value: 5 },
];

console.log(min(array, "value")); // 1
```

### max

Get the maximum value from the array or by the given key.

`max(array: any[], key?: string): number`

```ts
import { max } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(max(array)); // 5
```

We can also get the maximum value by the given key.

```ts
import { max } from "@mongez/reinforcements";

const array = [
  { id: 1, value: 1 },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  { id: 5, value: 5 },
];

console.log(max(array, "value")); // 5
```

### sum

Get the sum of all values in the array or by the given key.

`sum(array: any[], key?: string): number`

```ts
import { sum } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(sum(array)); // 15
```

We can also get the sum of all values by the given key.

```ts
import { sum } from "@mongez/reinforcements";

const array = [
  { id: 1, value: 1 },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  { id: 5, value: 5 },
];

console.log(sum(array, "value")); // 15
```

### Average

Calculate the average of an array.

`average(array: any[], key?: string): number`

```ts
import { average } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(average(array)); // 3
```

You can also get an average of an array of objects by passing the key of the property you want to get the average of.

```ts
import { average } from "@mongez/reinforcements";

const array = [
  { id: 1, value: 1 },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  { id: 5, value: 5 },
];

console.log(average(array, "value")); // 3
```

### Median

Calculate the median of an array or by the given key.

`median(array: any[], key?: string): number`

```ts
import { median } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(median(array)); // 3
```

We can also get the median by the given key.

```ts
import { median } from "@mongez/reinforcements";

const array = [
  { id: 1, value: 1 },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  { id: 5, value: 5 },
];

console.log(median(array, "value")); // 3
```

### Unique

Get unique values from the array or by the given key.

`unique(array: any[], key?: string): any[]`

```ts
import { unique } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];

console.log(unique(array)); // [1, 2, 3, 4, 5]
```

We can also get unique values by the given key.

```ts
import { unique } from "@mongez/reinforcements";

const array = [
  { id: 1, value: 1 },
  { id: 2, value: 2 },
  { id: 3, value: 3 },
  { id: 4, value: 4 },
  { id: 5, value: 5 },
  { id: 6, value: 1 },
  { id: 7, value: 2 },
  { id: 8, value: 3 },
  { id: 9, value: 4 },
  { id: 10, value: 5 },
];

console.log(unique(array, "value")); // [1, 2, 3, 4, 5]
```

### Push Unique

Push a value or more to the array if it doesn't exist.

`pushUnique<T = any>(array: T[], ...items: T[]): T[]`

```ts
import { pushUnique } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(pushUnique(array, 6, 5, 6, 1, 2, 4, 3)); // [1, 2, 3, 4, 5, 6]
```

### Unshift Unique

Add a value or more to the beginning array if it doesn't exist.

`unshiftUnique<T = any>(array: T[], ...items: T[]): T[]`

```ts
import { unshiftUnique } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(unshiftUnique(array, 6, 7, 5, 6, 1, 2, 4, 3)); // [7, 6, 1, 2, 3, 4, 5]
```

### Range

> Added in v2.3.0

Generates an array of numbers starting from the given min value to the given max value.

`range(min: number, max: number): number[]`

```ts
import { range } from "@mongez/reinforcements";

console.log(range(1, 6)); // [1, 2, 3, 4, 5, 6]

console.log(range(3, 5)); // [3, 4, 5]
```

If the given `min` or `max` parameter is not a number, an error **will be thrown**.

> Min value must be higher than max value.

## Working With Strings

The following list defines all available string utilities

- [Capitalize](#capitalize): Capitalize the first letter of the given string.
- [Camel Case](#camel-case): Convert the given string to camel case.
- [Snake Case](#snake-case): Convert the given string to snake case.
- [Kebab Case](#kebab-case): Convert the given string to kebab case.
- [Studly/Pascal Case](#studly-case): Convert the given string to pascal/studly case.
- [ucfirst](#ucfirst): Capitalize the first letter of each word in the given string.
- [To Input Name](#toinputname): Convert a dot notation string to proper input name (Brackets).
- [Extension](#extension): Get the extension of the given string.
- [Read More Characters](#read-more-characters): Cut off the given string after the given number of characters.
- [Read More Words](#read-more-words): Cut off the given string after the given number of words.
- [Remove First](#remove-first-matched-string): Remove the first matched string from the given string.
- [Remove Last](#remove-last-matched-string): Remove the last matched string from the given string.
- [Replace First](#replace-first-matched-string): Replace the first matched string from the given string.
- [Replace Last](#replace-last-matched-string): Replace the last matched string from the given string.
- [Replace All](#replace-all-matched-string): Replace all matched strings from the given string.
- [Repeats Of](#count-repeats-of-needle-in-a-string): Count Repeats of needle in a string.
- [Trim](#trimming-values-from-string): Remove a string from the beginning and end of the given string.
- [Trim Left](#trimming-values-from-string): Remove a string from the beginning of the given string.
- [Trim Right](#trimming-values-from-string): Remove a string from the end of the given string.
- [Starts With Arabic Letter](#detect-if-string-starts-with-arabic): Detect if string starts with Arabic letter.
- [Name Initials](#name-initials): Get the initials of the given name.

### Capitalize

Capitalize each word in string Separated by whitespace `capitalize(string: string): string`.

```ts
import { capitalize } from "@mongez/reinforcements";

const words = "hello world";

console.log(capitalize(words)); // Hello World
```

### Camel Case

Convert string to camel case, each word in string Separated by **whitespace** **underscores** or **dashes** `toCamelCase(string: string, separator: string = "\\s+|-|/|_|\\."): string`.

```ts
import { toCamelCase } from "@mongez/reinforcements";

const words = "hello world";

console.log(toCamelCase(words)); // helloWorld
```

Any of following will be used as a separator for the text, `.` | `-` | `whitespace` | `/`, you can set the separator as second argument though.

### Snake Case

Convert string to snake case, each word in string Separated by **whitespace** or **dashes** `toSnakeCase(string: string, separator: string = '_', lowerAll: boolean = true): string`.

The final output of the text will be all letters in lower case string separated by \_ **underscores**.

```ts
import { toSnakeCase } from "@mongez/reinforcements";

const words = "hello world";

console.log(toSnakeCase(words)); // hello_world
```

You can also set custom separator as second argument.

```ts
import { toSnakeCase } from "@mongez/reinforcements";

const words = "hello world";

console.log(toSnakeCase(words, "-")); // hello-world
```

Also setting the third argument to false will not convert letters to lower case, will keep each letter as its own.

```ts
import { toSnakeCase } from "@mongez/reinforcements";

const words = "Hello World";

console.log(toSnakeCase(words, "-", false)); // Hello_World
```

### Kebab Case

Convert string to kebab case, each word in string Separated by **whitespace** or **dashes** or **Upper Letters** `toKebabCase(string: string, lowerAll: boolean = true): string`.

The final output of the text will be all letters in lower case string separated by \- **dashes**.

```ts
import { toKebabCase } from "@mongez/reinforcements";

const words = "hello world";

console.log(toKebabCase(words)); // hello-world
```

If you want to ignore the lower case conversion, set the second argument to false.

```ts
import { toKebabCase } from "@mongez/reinforcements";

const words = "Hello World";

console.log(toKebabCase(words, false)); // Hello-World
```

### Studly Case

Convert string to studly case, each word in string Separated by **whitespace**, **underscores** or **dashes** `toStudlyCase(string: string, separator: string = "-|\\.|_|\\s"): string`.

The final output will be capitalizing each word and glue it together without any separators such as **whitespace**, **under scores** or **dashes**.

```ts
import { toStudlyCase } from "@mongez/reinforcements";

const words = "hello world";

console.log(toStudlyCase(words)); // HelloWorld
```

### Ucfirst

Capitalize only first word of string `ucfirst(string: string): string`.

```ts
import { ucfirst } from "@mongez/reinforcements";

const words = "hello world";

console.log(ucfirst(words)); // Hello world
```

### toInputName

Convert dot notation syntax to valid html input name `toInputName(string: string): string`.

```ts
import { toInputName } from "@mongez/reinforcements";

const name = "user.name";

console.log(toInputName(name)); // user[name]
console.log(toInputName("keywords.en.list[]")); // keywords[en][list][]
```

### Extension

Get the last extension in the string, the string that is suffix to last dot `.`.

`extension(string: string): string`

```ts
import { extension } from "@mongez/reinforcements";

const file = "my-image.png";

console.log(extension(file)); //png
```

### Read more characters

This function will cut off the string when characters reach limit, and append three dots `...` at the end of the string.

`readMoreChars(string: string, length: number, readMoreDots: string = '...'): string`

```ts
import { readMoreChars } from "@mongez/reinforcements";

const string = "This is a fine words list";

console.log(readMoreChars(string, 20)); // This is a fine words...

// if the given limit is equal to or more than string length, then the entire string will be returned without any dots
console.log(readMoreChars(string, 30)); // This is a fine words list

// change the three dots to something else

const string = "This is a fine words list";

console.log(readMoreChars(string, 20, " >>")); // This is a fine words >>
```

### Read more words

This function will cut off the string when words reach the given limit, and append three dots `...` at the end of the string.

This works based on total number of whitespace in the string.

`readMoreWords(string: string, length: number, readMoreDots: string = '...'): string`

```ts
import { readMoreWords } from "@mongez/reinforcements";

const string = "This is a fine words list";

console.log(readMoreWords(string, 4)); // This is a fine...

// if the given limit is equal to or more than words length, then the entire string will be returned without any dots
console.log(readMoreWords(string, 6)); // This is a fine words list

// change the three dots to something else

const string = "This is a fine words list";

console.log(readMoreWords(string, 4, " >>")); // This is a fine >>
```

### Remove first matched string

Remove the first matched needle to the given string.

`removeFirst(string: string, needle: string): string`

```ts
import { removeFirst } from "@mongez/reinforcements";

const words = "welcome home buddy, your are not safe at your home!";

console.log(removeFirst(words, "home")); // welcome  buddy, your are not safe at your home!
```

### Remove last matched string

Remove the last matched needle to the given string.

`removeLast(string: string, needle: string): string`

```ts
import { removeLast } from "@mongez/reinforcements";

const words = "welcome home buddy, your are not safe at your home!";

console.log(removeLast(words, "home")); // welcome home buddy, your are not safe at your !
```

### Replace first matched string

Replace the first matched needle to the given string.

`replaceFirst(string:string, needle: string, replacement: string): string`

```ts
import { replaceFirst } from "@mongez/reinforcements";

const words = "welcome home buddy, your are not safe at your home!";

console.log(replaceFirst(words, "home", "country")); // welcome country buddy, your are not safe at your home!
```

### Replace last matched string

Replace the last matched needle to the given string.

`replaceLast(string:string, needle: string, replacement: string): string`

```ts
import { replaceLast } from "@mongez/reinforcements";

const words = "welcome home buddy, your are not safe at your home!";

console.log(replaceLast(words, "home", "country")); // welcome home buddy, your are not safe at your country!
```

### Replace all matched string

Replace all matched words to the given string.

`replaceAll(string: string, searchText:string, replacement: string): string`

```ts
import { replaceAll } from "@mongez/reinforcements";

const words = "welcome home buddy, your are not safe at your home!";

console.log(replaceAll(words, "home", "country")); // welcome country buddy, your are not safe at your country!
```

### Count repeats of needle in a string

Count repeats of a needle in the given string.

`repeatsOf(string: string, needle: string, caseSensitive: boolean = true): number`

```ts
import { repeatsOf } from "@mongez/reinforcements";

const words = "welcome home buddy, your are not safe at your home!";

console.log(repeatsOf(words, "home")); // 2
```

You may also detect number of repetitions ignoring case sensitive.

```ts
import { repeatsOf } from "@mongez/reinforcements";

// note the first Home is capitalized
const words = "welcome Home buddy, your are not safe at your home!";

// case sensitive
console.log(repeatsOf(words, "home")); // 1
// case insensitive
console.log(repeatsOf(words, "home", false)); // 2
```

### Trimming values from string

Trim value from the start and the end of a string.

`trim(string: string, needle: string = ' '): string`

```ts
import { trim } from "@mongez/reinforcements";

const string = " space at the start and at the end ";

console.log(trim(string)); // "space at the start and at the end"
```

But why not use [String.trim()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim) directly? well they both will give you same functionality except that `trim()` function trims any value not only white space.

Remove certain value:

```ts
import { trim } from "@mongez/reinforcements";

const string = "/home/";

console.log(trim(string, "/")); // home
```

### Left Trimming values from string

Trim value from the start of a string.

`ltrim(string: string, needle: string = ' '): string`

```ts
import { ltrim } from "@mongez/reinforcements";

const string = " A space at the start and keep space at the end ";

console.log(ltrim(string)); // "A space at the start and keep space at the end "
```

Remove certain value:

```ts
import { ltrim } from "@mongez/reinforcements";

const string = "home/";

console.log(ltrim(string, "/")); // home/
```

### Right Trimming values from string

Trim value from the end of a string.

`rtrim(string: string, needle: string = ' '): string`

```ts
import { rtrim } from "@mongez/reinforcements";

const string = " Keep A space at the start and remove space at the end ";

console.log(rtrim(string)); // " Keep A space at the start and remove space at the end"
```

Remove certain value:

```ts
import { ltrim } from "@mongez/reinforcements";

const string = "home/";

console.log(rtrim(string, "/")); // /home
```

### Detect if string starts with Arabic

Determine if the string starts with Arabic letter.

`startsWithArabic(text: string, trimmed: boolean = true): boolean {`

```ts
import { startsWithArabic } from "@mongez/reinforcements";

const string = "English Text";

const arabicString = "مرحبا";

console.log(startsWithArabic(string)); // false
console.log(startsWithArabic(arabicString)); // true
```

### Name Initials

Get initials from a name.

`initials(name: string, separator = ''): string`

```ts
import { initials } from "@mongez/reinforcements";

const name = "John Doe";

console.log(initials(name)); // JD
```

You can also pass a separator to separate the initials.

```ts
import { initials } from "@mongez/reinforcements";

const name = "John Doe";

console.log(initials(name, ".")); // J.D
```

If the given parameter is not a string it will throw an error.

```ts
import { initials } from "@mongez/reinforcements";

const name = 123;

console.log(initials(name)); // Error: The given name is not a string.
```

## Numbers

Here are the aviation numbers utilities.

- [Round](#round-float-numbers): Round numbers to a certain decimal places.

### Round float numbers

To round float numbers, use `round(value: number, precision: number = 2): number`.

```ts
import { round } from "@mongez/reinforcements";

console.log(round(10.0001)); // 10
console.log(round(10.0478878)); // 10.04
console.log(round(10.6987894849)); // 10.69
console.log(round(10.6987894849, 3)); // 10.698
```

## Mixed Utilities

This section covers utilities that work with multiple types.

- [Are Equal](#equal-values): Check if the two values are equal regardless of their type.
- [Shuffle](#shuffle): Shuffle an array or a string.

### Equal Values

Using `areEqual` function will check if the given two values equal to each other, it will validate against any type such as objects, arrays, strings, numbers, booleans, null, undefined, symbols.

```ts
import { areEqual } from "@mongez/reinforcements";

console.log(areEqual(1, 1)); // true

console.log(areEqual("1", 1)); // false

console.log(areEqual("1", "1")); // true

console.log(areEqual(true, true)); // true

console.log(areEqual(true, false)); // false

console.log(areEqual(null, null)); // true

console.log(areEqual(undefined, undefined)); // true

console.log(areEqual(Symbol("1"), Symbol("1"))); // false

console.log(areEqual(Symbol("1"), Symbol("2"))); // false

console.log(areEqual([1, 2, 3], [1, 2, 3])); // true

console.log(areEqual([1, 2, 3], [1, 2, 3, 4])); // false

console.log(areEqual({ id: 1 }, { id: 1 })); // true

console.log(areEqual({ id: 1 }, { id: 2 })); // false
```

### Shuffle

Shuffle an array or a string.

`shuffle(value: any[] | string): any[] | string`

```ts
import { shuffle } from "@mongez/reinforcements";

const array = [1, 2, 3, 4, 5];

console.log(shuffle(array)); // [2, 4, 1, 5, 3]

const string = "Hello World";

console.log(shuffle(string)); // "WlloHrodl"
```

## General Utilities

The section covers general utilities that can be used in any project.

- [Debounce](#debounce): Debounce a function to be called after a specific time.
- [Escape Regex](#escape-regex): Escape regex special characters.
- [Lazy](#lazy): Defer a value's computation until first use and memoise the result.

### Debounce

`debounce(callback: Function, timer: number = 0): void`

You can debounce your functions using `debounce` to prevent multiple calls.

```tsx
function sendEmail(e: any) {
  sendEmailApi(e.target);
}

// If user clicked 5 times, it will make 5 ajax calls

<button click={sendEmail}>Send Email</button>;
```

Now when using `debounce`

```tsx
import { debounce } from "@mongez/reinforcements";

function sendEmail(e: any) {
  sendEmailApi(e.target);
}

const debouncedSendEmail = debounce(sendEmail);

// If user clicked 5 times, it will make only one ajax call

<button click={debouncedSendEmail}>Send Email</button>;
```

You can also set a timer when to trigger the function

```tsx
import { debounce } from "@mongez/reinforcements";

function sendEmail(e: any) {
  sendEmailApi(e.target);
}

const debouncedSendEmail = debounce(sendEmail, 1000);

// If user clicked 5 times, it will make only one ajax call

<button click={debouncedSendEmail}>Send Email</button>;
```

### Escape Regex

`escapeRegex(string: string): string`

Escape regex special characters in the given string.

```ts
import { escapeRegex } from "@mongez/reinforcements";

const string =
  "This is a string with special characters like: . * + ? ^ $ { } ( ) | [ ] / \\";

console.log(escapeRegex(string)); // This is a string with special characters like: \\. \\* \\+ \\? \\^ \\$ \\{ \\} \\( \\) \\| \\[ \\] / \\\\
```

### Lazy

> Added in v2.4.0

Wrap a value-producing function as a lazy reference. The producer isn't invoked until the first `resolve()` call; subsequent calls return the same cached value.

`lazy<T>(producer: () => T): Lazy<T>`

The returned `Lazy<T>` exposes:

- `resolve(): T` — compute (if not yet resolved) and return the cached value
- `reset(): void` — drop the cached value; next `resolve()` recomputes lazily
- `isResolved(): boolean` — whether `resolve()` has been called and a value cached
- `peek(): T | undefined` — return the cached value without forcing computation

Plus a companion type-guard:

`isLazy<T = unknown>(value: unknown): value is Lazy<T>`

#### Deferring expensive computation

The producer runs at most once, the first time you ask for the value. If you never ask, it never runs.

```ts
import { lazy } from "@mongez/reinforcements";

const config = lazy(() => {
  console.log("loading config from disk...");
  return JSON.parse(readFileSync("config.json", "utf-8"));
});

// nothing has happened yet — the file hasn't been read

config.resolve(); // → "loading config from disk..." then returns parsed object
config.resolve(); // returns the cached object, no log, no disk read
```

#### Breaking circular references

JavaScript closures capture variable **bindings**, not values. A `lazy(() => x)` call records "read whatever `x` is when you later call `.resolve()`," so it works even when `x` isn't yet defined at the wrap site.

```ts
import { lazy } from "@mongez/reinforcements";

// a.ts
import { b } from "./b";

export const a = {
  // direct `b` here would crash if b.ts and a.ts import each other at top level
  partner: lazy(() => b),
};

// b.ts
import { a } from "./a";

export const b = {
  partner: lazy(() => a),
};

// Both modules finish loading without touching each other's values.
// When something actually reads them, both are fully defined:
a.partner.resolve(); // === b
b.partner.resolve(); // === a
```

#### Inspecting state without forcing computation

`peek()` reads the cached value if there is one; `isResolved()` tells you whether `resolve()` has run yet.

```ts
import { lazy } from "@mongez/reinforcements";

const ref = lazy(() => fetchSomethingExpensive());

ref.isResolved(); // false
ref.peek();       // undefined — producer hasn't run

ref.resolve();    // runs producer, caches result

ref.isResolved(); // true
ref.peek();       // → cached value (no recomputation)
```

> Because `peek()` returns `undefined` both for "not yet resolved" and for "resolved to undefined," pair it with `isResolved()` when the distinction matters.

#### Invalidating the cache

`reset()` drops the memoised value so the next `resolve()` recomputes. Handy for tests, manual refresh after config reload, or any case where you want to force a recompute.

```ts
import { lazy } from "@mongez/reinforcements";

let counter = 0;
const next = lazy(() => ++counter);

next.resolve(); // 1
next.resolve(); // 1 — memoised

next.reset();
next.resolve(); // 2 — producer ran again
```

`reset()` is a no-op if `resolve()` hasn't been called yet.

#### Identifying lazy values

`isLazy()` is a type-guard you can use to check whether a value came from `lazy()`:

```ts
import { lazy, isLazy } from "@mongez/reinforcements";

const ref = lazy(() => 42);

isLazy(ref);                  // true
isLazy({ resolve: () => 1 }); // false — not produced by lazy()
isLazy(42);                   // false

function unwrap<T>(value: T | Lazy<T>): T {
  return isLazy<T>(value) ? value.resolve() : value;
}
```

## Random

Another good feature is `Random` object, which allows us to generate variant random values of different types.

### Generate random string

To generate a random string use `Random.string(length: number = 32): string` method.

```ts
import { Random } from "@mongez/reinforcements";

Random.string(); // 4G8JyA4uM5YVMbkqVaoYnW6GzPcC64Fy
```

To generate a random string with certain length, just pass the length value to the function.

```ts
import { Random } from "@mongez/reinforcements";

Random.string(12); // P057C06VPwxl
```

### Generate random integer

To generate a random integer use `Random.int(min: number = 1, max: number = 9999999): number` method.

```ts
import { Random } from "@mongez/reinforcements";

Random.int(); // 7387115
Random.int(); // 9411554
Random.int(); // 691593
```

To set min value, pass first argument with minimum value

```ts
import { Random } from "@mongez/reinforcements";

Random.int(10); // 7387115
```

To set min and max value, pass second argument as well with maximum value

```ts
import { Random } from "@mongez/reinforcements";

Random.int(10, 100); // 36
```

> `Random.integer` is an alias to `Random.int`.

### Generate random html id

This function will generate a valid random html id string `Random.id(length: number = 6, startsWith: string = "el-"): string`.

```ts
import { Random } from "@mongez/reinforcements";

Random.id(); // el-SDFefdvgtr2e3qw
Random.id(); // el-fasrg3q
```

You may set the length as first argument and/or set the id prefix as second argument (**default is el-**).

### Generate random boolean value

To generate random boolean value use `Random.bool(): boolean` or `Random.boolean(): boolean`

```ts
import { Random } from "@mongez/reinforcements";

Random.bool(); // true
Random.bool(); // true
Random.bool(); // false
Random.boolean(); // false
Random.boolean(); // true
Random.boolean(); // false
```

### Generate random color

To generate random color use `Random.color(): string` method.

```ts
import { Random } from "@mongez/reinforcements";

Random.color(); // #f2f2f2
```

### Generate random date

To generate random date use `Random.date(min: Date = new Date(1970, 1, 1), max: Date = new Date()): Date` method.

```ts
import { Random } from "@mongez/reinforcements";

Random.date(); // 2020-12-12T12:12:12.000Z

// Get random date between two dates
Random.date(new Date(2010, 1, 1), new Date(2020, 1, 1)); // 2015-12-12T12:12:12.000Z

// Get random date that is higher than the given date
Random.date(new Date(2010, 1, 1)); // 2015-12-12T12:12:12.000Z

// Get random date that is lower than the given date
Random.date(null, new Date(2010, 1, 1)); // 2005-12-12T12:12:12.000Z
```

## Tests

To run tests run `npm run test` or `yarn test`

## Change Log

- 2.4.0
  - Added [Lazy](#lazy) utility — defer + memoise a value, with `reset` / `peek` / `isResolved` controls and an `isLazy` type-guard.
- 2.3.5 (06 May 2023)
  - Fixed clone function array cloning does not lose reference for nested objects.
- 2.3.4 (06 May 2023)
  - Fixed clone function array cloning does not lose reference for nested objects.
- 2.3.3 (06 May 2023)
  - Fixed clone function array cloning does not lose reference for nested objects.
- 2.3.2 (06 May 2023)
  - Fixed clone function array cloning does not lose reference for nested objects.
- 2.3.0 (25 Mar 2023)
  - Added [Range](#range) function.
  - Exposed typings.
  - Enhanced tests for `areEqual` function,
- 2.2.7 (22 Feb 2023)
  - Added [Name Initials](#name-initials) function.
- 2.2.0 (08 Nov 2022)
  - Migrated Collections From Package to separate package.
- 2.1.0 (06 Nov 2022)
  - Added [unset](#unset-keys-from-object) function.
  - Fixed `except` and `only` functions to accept dot notation syntax.
- 2.0.5 (25 Oct 2022)
  - Added `toKebabCase` function
- 2.0.0 (24 Oct 2022)
  - Fully refactored the code.
  - Added Immutable Collections class.
- 1.0.28 (11 Aug 2022)
  - Fixed object merge call.
- 1.0.27 (11 Aug 2022)
  - Added test.
  - `toCamelCase` now will use the dot `.` as separator.
  - `toCamelCase`'s separator is not explicit as second argument.
- 1.0.26 (08 Jun 2022)
  - Removed `sprintf-js` from dependencies.
- 1.0.25 (08 Jun 2022)
  - Fixed Flatten method with empty arrays.
- 1.0.23 (03 Jun 2022)
  - Added [debounce](#debounce) function.
  - Added `/` to be replaced in `toCamelCase` `toStudlyCase` and `toSnakeCase`.
- 1.0.22 (10 Feb 2022)
  - Added [Obj.except](#getting-all-object-except-for-certain-keys) method.
- 1.0.21 (28 Jan 2022)
  - Fixed `objOnly` method that adds undefined values if key does not exist on the given object.
- 1.0.19 (15 Jan 2022)
  - Added [Clone objects](#clone-objects) function.
- 1.0.18 (15 Jan 2022)
  - Added [Flatten objects](#flatten-objects) function.

## TODO

- Create tests.
- Implements Array helpers list.
