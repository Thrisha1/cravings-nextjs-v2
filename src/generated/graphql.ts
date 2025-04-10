import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };

function fetcher<TData, TVariables>(endpoint: string, requestInit: RequestInit, query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch(endpoint, {
      method: 'POST',
      ...requestInit,
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  }
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  date: { input: any; output: any; }
  uuid: { input: any; output: any; }
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']['input']>;
  _gt?: InputMaybe<Scalars['Int']['input']>;
  _gte?: InputMaybe<Scalars['Int']['input']>;
  _in?: InputMaybe<Array<Scalars['Int']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Int']['input']>;
  _lte?: InputMaybe<Scalars['Int']['input']>;
  _neq?: InputMaybe<Scalars['Int']['input']>;
  _nin?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']['input']>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']['input']>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']['input']>;
};

/** categories that a store have */
export type Category = {
  __typename?: 'category';
  cravings_category: Scalars['String']['output'];
  id: Scalars['uuid']['output'];
  name: Scalars['String']['output'];
  patner_id: Scalars['uuid']['output'];
};

/** aggregated selection of "category" */
export type Category_Aggregate = {
  __typename?: 'category_aggregate';
  aggregate?: Maybe<Category_Aggregate_Fields>;
  nodes: Array<Category>;
};

/** aggregate fields of "category" */
export type Category_Aggregate_Fields = {
  __typename?: 'category_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Category_Max_Fields>;
  min?: Maybe<Category_Min_Fields>;
};


/** aggregate fields of "category" */
export type Category_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Category_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "category". All fields are combined with a logical 'AND'. */
export type Category_Bool_Exp = {
  _and?: InputMaybe<Array<Category_Bool_Exp>>;
  _not?: InputMaybe<Category_Bool_Exp>;
  _or?: InputMaybe<Array<Category_Bool_Exp>>;
  cravings_category?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  patner_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "category" */
export enum Category_Constraint {
  /** unique or primary key constraint on columns "id" */
  CategoryPkey = 'category_pkey'
}

/** input type for inserting data into table "category" */
export type Category_Insert_Input = {
  cravings_category?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  patner_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Category_Max_Fields = {
  __typename?: 'category_max_fields';
  cravings_category?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  patner_id?: Maybe<Scalars['uuid']['output']>;
};

/** aggregate min on columns */
export type Category_Min_Fields = {
  __typename?: 'category_min_fields';
  cravings_category?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  patner_id?: Maybe<Scalars['uuid']['output']>;
};

/** response of any mutation on the table "category" */
export type Category_Mutation_Response = {
  __typename?: 'category_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Category>;
};

/** on_conflict condition type for table "category" */
export type Category_On_Conflict = {
  constraint: Category_Constraint;
  update_columns?: Array<Category_Update_Column>;
  where?: InputMaybe<Category_Bool_Exp>;
};

/** Ordering options when selecting data from "category". */
export type Category_Order_By = {
  cravings_category?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  patner_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: category */
export type Category_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "category" */
export enum Category_Select_Column {
  /** column name */
  CravingsCategory = 'cravings_category',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  PatnerId = 'patner_id'
}

/** input type for updating data in table "category" */
export type Category_Set_Input = {
  cravings_category?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  patner_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** Streaming cursor of the table "category" */
export type Category_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Category_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Category_Stream_Cursor_Value_Input = {
  cravings_category?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  patner_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** update columns of table "category" */
export enum Category_Update_Column {
  /** column name */
  CravingsCategory = 'cravings_category',
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  PatnerId = 'patner_id'
}

export type Category_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Category_Set_Input>;
  /** filter the rows which have to be updated */
  where: Category_Bool_Exp;
};

/** all items in cravings, new items will be added while adding menu */
export type Cravings_Items = {
  __typename?: 'cravings_items';
  category: Scalars['String']['output'];
  id: Scalars['uuid']['output'];
  image_url: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** aggregated selection of "cravings_items" */
export type Cravings_Items_Aggregate = {
  __typename?: 'cravings_items_aggregate';
  aggregate?: Maybe<Cravings_Items_Aggregate_Fields>;
  nodes: Array<Cravings_Items>;
};

/** aggregate fields of "cravings_items" */
export type Cravings_Items_Aggregate_Fields = {
  __typename?: 'cravings_items_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Cravings_Items_Max_Fields>;
  min?: Maybe<Cravings_Items_Min_Fields>;
};


/** aggregate fields of "cravings_items" */
export type Cravings_Items_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Cravings_Items_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "cravings_items". All fields are combined with a logical 'AND'. */
export type Cravings_Items_Bool_Exp = {
  _and?: InputMaybe<Array<Cravings_Items_Bool_Exp>>;
  _not?: InputMaybe<Cravings_Items_Bool_Exp>;
  _or?: InputMaybe<Array<Cravings_Items_Bool_Exp>>;
  category?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  image_url?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "cravings_items" */
export enum Cravings_Items_Constraint {
  /** unique or primary key constraint on columns "id" */
  CravingsItemsPkey = 'cravings_items_pkey'
}

/** input type for inserting data into table "cravings_items" */
export type Cravings_Items_Insert_Input = {
  category?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Cravings_Items_Max_Fields = {
  __typename?: 'cravings_items_max_fields';
  category?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  image_url?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Cravings_Items_Min_Fields = {
  __typename?: 'cravings_items_min_fields';
  category?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  image_url?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "cravings_items" */
export type Cravings_Items_Mutation_Response = {
  __typename?: 'cravings_items_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Cravings_Items>;
};

/** on_conflict condition type for table "cravings_items" */
export type Cravings_Items_On_Conflict = {
  constraint: Cravings_Items_Constraint;
  update_columns?: Array<Cravings_Items_Update_Column>;
  where?: InputMaybe<Cravings_Items_Bool_Exp>;
};

/** Ordering options when selecting data from "cravings_items". */
export type Cravings_Items_Order_By = {
  category?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image_url?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
};

/** primary key columns input for table: cravings_items */
export type Cravings_Items_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "cravings_items" */
export enum Cravings_Items_Select_Column {
  /** column name */
  Category = 'category',
  /** column name */
  Id = 'id',
  /** column name */
  ImageUrl = 'image_url',
  /** column name */
  Name = 'name'
}

/** input type for updating data in table "cravings_items" */
export type Cravings_Items_Set_Input = {
  category?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "cravings_items" */
export type Cravings_Items_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Cravings_Items_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Cravings_Items_Stream_Cursor_Value_Input = {
  category?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "cravings_items" */
export enum Cravings_Items_Update_Column {
  /** column name */
  Category = 'category',
  /** column name */
  Id = 'id',
  /** column name */
  ImageUrl = 'image_url',
  /** column name */
  Name = 'name'
}

export type Cravings_Items_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Cravings_Items_Set_Input>;
  /** filter the rows which have to be updated */
  where: Cravings_Items_Bool_Exp;
};

/** ordering argument of a cursor */
export enum Cursor_Ordering {
  /** ascending ordering of the cursor */
  Asc = 'ASC',
  /** descending ordering of the cursor */
  Desc = 'DESC'
}

/** Boolean expression to compare columns of type "date". All fields are combined with logical 'AND'. */
export type Date_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['date']['input']>;
  _gt?: InputMaybe<Scalars['date']['input']>;
  _gte?: InputMaybe<Scalars['date']['input']>;
  _in?: InputMaybe<Array<Scalars['date']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['date']['input']>;
  _lte?: InputMaybe<Scalars['date']['input']>;
  _neq?: InputMaybe<Scalars['date']['input']>;
  _nin?: InputMaybe<Array<Scalars['date']['input']>>;
};

/** followers of each store */
export type Followers = {
  __typename?: 'followers';
  id: Scalars['uuid']['output'];
  partner_id: Scalars['uuid']['output'];
  phone: Scalars['String']['output'];
  user_id: Scalars['uuid']['output'];
};

/** aggregated selection of "followers" */
export type Followers_Aggregate = {
  __typename?: 'followers_aggregate';
  aggregate?: Maybe<Followers_Aggregate_Fields>;
  nodes: Array<Followers>;
};

/** aggregate fields of "followers" */
export type Followers_Aggregate_Fields = {
  __typename?: 'followers_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Followers_Max_Fields>;
  min?: Maybe<Followers_Min_Fields>;
};


/** aggregate fields of "followers" */
export type Followers_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Followers_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "followers". All fields are combined with a logical 'AND'. */
export type Followers_Bool_Exp = {
  _and?: InputMaybe<Array<Followers_Bool_Exp>>;
  _not?: InputMaybe<Followers_Bool_Exp>;
  _or?: InputMaybe<Array<Followers_Bool_Exp>>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  partner_id?: InputMaybe<Uuid_Comparison_Exp>;
  phone?: InputMaybe<String_Comparison_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "followers" */
export enum Followers_Constraint {
  /** unique or primary key constraint on columns "id" */
  FollowersPkey = 'followers_pkey'
}

/** input type for inserting data into table "followers" */
export type Followers_Insert_Input = {
  id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Followers_Max_Fields = {
  __typename?: 'followers_max_fields';
  id?: Maybe<Scalars['uuid']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** aggregate min on columns */
export type Followers_Min_Fields = {
  __typename?: 'followers_min_fields';
  id?: Maybe<Scalars['uuid']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** response of any mutation on the table "followers" */
export type Followers_Mutation_Response = {
  __typename?: 'followers_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Followers>;
};

/** on_conflict condition type for table "followers" */
export type Followers_On_Conflict = {
  constraint: Followers_Constraint;
  update_columns?: Array<Followers_Update_Column>;
  where?: InputMaybe<Followers_Bool_Exp>;
};

/** Ordering options when selecting data from "followers". */
export type Followers_Order_By = {
  id?: InputMaybe<Order_By>;
  partner_id?: InputMaybe<Order_By>;
  phone?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: followers */
export type Followers_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "followers" */
export enum Followers_Select_Column {
  /** column name */
  Id = 'id',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  Phone = 'phone',
  /** column name */
  UserId = 'user_id'
}

/** input type for updating data in table "followers" */
export type Followers_Set_Input = {
  id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** Streaming cursor of the table "followers" */
export type Followers_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Followers_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Followers_Stream_Cursor_Value_Input = {
  id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** update columns of table "followers" */
export enum Followers_Update_Column {
  /** column name */
  Id = 'id',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  Phone = 'phone',
  /** column name */
  UserId = 'user_id'
}

export type Followers_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Followers_Set_Input>;
  /** filter the rows which have to be updated */
  where: Followers_Bool_Exp;
};

/** menus of each store */
export type Menu = {
  __typename?: 'menu';
  category: Scalars['String']['output'];
  cravings_category: Scalars['String']['output'];
  id: Scalars['uuid']['output'];
  image_url: Scalars['String']['output'];
  name: Scalars['String']['output'];
  partner_id: Scalars['uuid']['output'];
  price: Scalars['Int']['output'];
};

/** aggregated selection of "menu" */
export type Menu_Aggregate = {
  __typename?: 'menu_aggregate';
  aggregate?: Maybe<Menu_Aggregate_Fields>;
  nodes: Array<Menu>;
};

/** aggregate fields of "menu" */
export type Menu_Aggregate_Fields = {
  __typename?: 'menu_aggregate_fields';
  avg?: Maybe<Menu_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Menu_Max_Fields>;
  min?: Maybe<Menu_Min_Fields>;
  stddev?: Maybe<Menu_Stddev_Fields>;
  stddev_pop?: Maybe<Menu_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Menu_Stddev_Samp_Fields>;
  sum?: Maybe<Menu_Sum_Fields>;
  var_pop?: Maybe<Menu_Var_Pop_Fields>;
  var_samp?: Maybe<Menu_Var_Samp_Fields>;
  variance?: Maybe<Menu_Variance_Fields>;
};


/** aggregate fields of "menu" */
export type Menu_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Menu_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Menu_Avg_Fields = {
  __typename?: 'menu_avg_fields';
  price?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "menu". All fields are combined with a logical 'AND'. */
export type Menu_Bool_Exp = {
  _and?: InputMaybe<Array<Menu_Bool_Exp>>;
  _not?: InputMaybe<Menu_Bool_Exp>;
  _or?: InputMaybe<Array<Menu_Bool_Exp>>;
  category?: InputMaybe<String_Comparison_Exp>;
  cravings_category?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  image_url?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  partner_id?: InputMaybe<Uuid_Comparison_Exp>;
  price?: InputMaybe<Int_Comparison_Exp>;
};

/** unique or primary key constraints on table "menu" */
export enum Menu_Constraint {
  /** unique or primary key constraint on columns "id" */
  MenuPkey = 'menu_pkey'
}

/** input type for incrementing numeric columns in table "menu" */
export type Menu_Inc_Input = {
  price?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "menu" */
export type Menu_Insert_Input = {
  category?: InputMaybe<Scalars['String']['input']>;
  cravings_category?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  price?: InputMaybe<Scalars['Int']['input']>;
};

/** aggregate max on columns */
export type Menu_Max_Fields = {
  __typename?: 'menu_max_fields';
  category?: Maybe<Scalars['String']['output']>;
  cravings_category?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  image_url?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  price?: Maybe<Scalars['Int']['output']>;
};

/** aggregate min on columns */
export type Menu_Min_Fields = {
  __typename?: 'menu_min_fields';
  category?: Maybe<Scalars['String']['output']>;
  cravings_category?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  image_url?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  price?: Maybe<Scalars['Int']['output']>;
};

/** response of any mutation on the table "menu" */
export type Menu_Mutation_Response = {
  __typename?: 'menu_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Menu>;
};

/** on_conflict condition type for table "menu" */
export type Menu_On_Conflict = {
  constraint: Menu_Constraint;
  update_columns?: Array<Menu_Update_Column>;
  where?: InputMaybe<Menu_Bool_Exp>;
};

/** Ordering options when selecting data from "menu". */
export type Menu_Order_By = {
  category?: InputMaybe<Order_By>;
  cravings_category?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image_url?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  partner_id?: InputMaybe<Order_By>;
  price?: InputMaybe<Order_By>;
};

/** primary key columns input for table: menu */
export type Menu_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "menu" */
export enum Menu_Select_Column {
  /** column name */
  Category = 'category',
  /** column name */
  CravingsCategory = 'cravings_category',
  /** column name */
  Id = 'id',
  /** column name */
  ImageUrl = 'image_url',
  /** column name */
  Name = 'name',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  Price = 'price'
}

/** input type for updating data in table "menu" */
export type Menu_Set_Input = {
  category?: InputMaybe<Scalars['String']['input']>;
  cravings_category?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  price?: InputMaybe<Scalars['Int']['input']>;
};

/** aggregate stddev on columns */
export type Menu_Stddev_Fields = {
  __typename?: 'menu_stddev_fields';
  price?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Menu_Stddev_Pop_Fields = {
  __typename?: 'menu_stddev_pop_fields';
  price?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Menu_Stddev_Samp_Fields = {
  __typename?: 'menu_stddev_samp_fields';
  price?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "menu" */
export type Menu_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Menu_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Menu_Stream_Cursor_Value_Input = {
  category?: InputMaybe<Scalars['String']['input']>;
  cravings_category?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  price?: InputMaybe<Scalars['Int']['input']>;
};

/** aggregate sum on columns */
export type Menu_Sum_Fields = {
  __typename?: 'menu_sum_fields';
  price?: Maybe<Scalars['Int']['output']>;
};

/** update columns of table "menu" */
export enum Menu_Update_Column {
  /** column name */
  Category = 'category',
  /** column name */
  CravingsCategory = 'cravings_category',
  /** column name */
  Id = 'id',
  /** column name */
  ImageUrl = 'image_url',
  /** column name */
  Name = 'name',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  Price = 'price'
}

export type Menu_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Menu_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Menu_Set_Input>;
  /** filter the rows which have to be updated */
  where: Menu_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Menu_Var_Pop_Fields = {
  __typename?: 'menu_var_pop_fields';
  price?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Menu_Var_Samp_Fields = {
  __typename?: 'menu_var_samp_fields';
  price?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Menu_Variance_Fields = {
  __typename?: 'menu_variance_fields';
  price?: Maybe<Scalars['Float']['output']>;
};

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root';
  /** delete data from the table: "category" */
  delete_category?: Maybe<Category_Mutation_Response>;
  /** delete single row from the table: "category" */
  delete_category_by_pk?: Maybe<Category>;
  /** delete data from the table: "cravings_items" */
  delete_cravings_items?: Maybe<Cravings_Items_Mutation_Response>;
  /** delete single row from the table: "cravings_items" */
  delete_cravings_items_by_pk?: Maybe<Cravings_Items>;
  /** delete data from the table: "followers" */
  delete_followers?: Maybe<Followers_Mutation_Response>;
  /** delete single row from the table: "followers" */
  delete_followers_by_pk?: Maybe<Followers>;
  /** delete data from the table: "menu" */
  delete_menu?: Maybe<Menu_Mutation_Response>;
  /** delete single row from the table: "menu" */
  delete_menu_by_pk?: Maybe<Menu>;
  /** delete data from the table: "offers" */
  delete_offers?: Maybe<Offers_Mutation_Response>;
  /** delete single row from the table: "offers" */
  delete_offers_by_pk?: Maybe<Offers>;
  /** delete data from the table: "offers_claimed" */
  delete_offers_claimed?: Maybe<Offers_Claimed_Mutation_Response>;
  /** delete single row from the table: "offers_claimed" */
  delete_offers_claimed_by_pk?: Maybe<Offers_Claimed>;
  /** delete data from the table: "partners" */
  delete_partners?: Maybe<Partners_Mutation_Response>;
  /** delete single row from the table: "partners" */
  delete_partners_by_pk?: Maybe<Partners>;
  /** delete data from the table: "payments" */
  delete_payments?: Maybe<Payments_Mutation_Response>;
  /** delete single row from the table: "payments" */
  delete_payments_by_pk?: Maybe<Payments>;
  /** delete data from the table: "qr_codes" */
  delete_qr_codes?: Maybe<Qr_Codes_Mutation_Response>;
  /** delete single row from the table: "qr_codes" */
  delete_qr_codes_by_pk?: Maybe<Qr_Codes>;
  /** delete data from the table: "reviews" */
  delete_reviews?: Maybe<Reviews_Mutation_Response>;
  /** delete single row from the table: "reviews" */
  delete_reviews_by_pk?: Maybe<Reviews>;
  /** delete data from the table: "users" */
  delete_users?: Maybe<Users_Mutation_Response>;
  /** delete single row from the table: "users" */
  delete_users_by_pk?: Maybe<Users>;
  /** insert data into the table: "category" */
  insert_category?: Maybe<Category_Mutation_Response>;
  /** insert a single row into the table: "category" */
  insert_category_one?: Maybe<Category>;
  /** insert data into the table: "cravings_items" */
  insert_cravings_items?: Maybe<Cravings_Items_Mutation_Response>;
  /** insert a single row into the table: "cravings_items" */
  insert_cravings_items_one?: Maybe<Cravings_Items>;
  /** insert data into the table: "followers" */
  insert_followers?: Maybe<Followers_Mutation_Response>;
  /** insert a single row into the table: "followers" */
  insert_followers_one?: Maybe<Followers>;
  /** insert data into the table: "menu" */
  insert_menu?: Maybe<Menu_Mutation_Response>;
  /** insert a single row into the table: "menu" */
  insert_menu_one?: Maybe<Menu>;
  /** insert data into the table: "offers" */
  insert_offers?: Maybe<Offers_Mutation_Response>;
  /** insert data into the table: "offers_claimed" */
  insert_offers_claimed?: Maybe<Offers_Claimed_Mutation_Response>;
  /** insert a single row into the table: "offers_claimed" */
  insert_offers_claimed_one?: Maybe<Offers_Claimed>;
  /** insert a single row into the table: "offers" */
  insert_offers_one?: Maybe<Offers>;
  /** insert data into the table: "partners" */
  insert_partners?: Maybe<Partners_Mutation_Response>;
  /** insert a single row into the table: "partners" */
  insert_partners_one?: Maybe<Partners>;
  /** insert data into the table: "payments" */
  insert_payments?: Maybe<Payments_Mutation_Response>;
  /** insert a single row into the table: "payments" */
  insert_payments_one?: Maybe<Payments>;
  /** insert data into the table: "qr_codes" */
  insert_qr_codes?: Maybe<Qr_Codes_Mutation_Response>;
  /** insert a single row into the table: "qr_codes" */
  insert_qr_codes_one?: Maybe<Qr_Codes>;
  /** insert data into the table: "reviews" */
  insert_reviews?: Maybe<Reviews_Mutation_Response>;
  /** insert a single row into the table: "reviews" */
  insert_reviews_one?: Maybe<Reviews>;
  /** insert data into the table: "users" */
  insert_users?: Maybe<Users_Mutation_Response>;
  /** insert a single row into the table: "users" */
  insert_users_one?: Maybe<Users>;
  /** update data of the table: "category" */
  update_category?: Maybe<Category_Mutation_Response>;
  /** update single row of the table: "category" */
  update_category_by_pk?: Maybe<Category>;
  /** update multiples rows of table: "category" */
  update_category_many?: Maybe<Array<Maybe<Category_Mutation_Response>>>;
  /** update data of the table: "cravings_items" */
  update_cravings_items?: Maybe<Cravings_Items_Mutation_Response>;
  /** update single row of the table: "cravings_items" */
  update_cravings_items_by_pk?: Maybe<Cravings_Items>;
  /** update multiples rows of table: "cravings_items" */
  update_cravings_items_many?: Maybe<Array<Maybe<Cravings_Items_Mutation_Response>>>;
  /** update data of the table: "followers" */
  update_followers?: Maybe<Followers_Mutation_Response>;
  /** update single row of the table: "followers" */
  update_followers_by_pk?: Maybe<Followers>;
  /** update multiples rows of table: "followers" */
  update_followers_many?: Maybe<Array<Maybe<Followers_Mutation_Response>>>;
  /** update data of the table: "menu" */
  update_menu?: Maybe<Menu_Mutation_Response>;
  /** update single row of the table: "menu" */
  update_menu_by_pk?: Maybe<Menu>;
  /** update multiples rows of table: "menu" */
  update_menu_many?: Maybe<Array<Maybe<Menu_Mutation_Response>>>;
  /** update data of the table: "offers" */
  update_offers?: Maybe<Offers_Mutation_Response>;
  /** update single row of the table: "offers" */
  update_offers_by_pk?: Maybe<Offers>;
  /** update data of the table: "offers_claimed" */
  update_offers_claimed?: Maybe<Offers_Claimed_Mutation_Response>;
  /** update single row of the table: "offers_claimed" */
  update_offers_claimed_by_pk?: Maybe<Offers_Claimed>;
  /** update multiples rows of table: "offers_claimed" */
  update_offers_claimed_many?: Maybe<Array<Maybe<Offers_Claimed_Mutation_Response>>>;
  /** update multiples rows of table: "offers" */
  update_offers_many?: Maybe<Array<Maybe<Offers_Mutation_Response>>>;
  /** update data of the table: "partners" */
  update_partners?: Maybe<Partners_Mutation_Response>;
  /** update single row of the table: "partners" */
  update_partners_by_pk?: Maybe<Partners>;
  /** update multiples rows of table: "partners" */
  update_partners_many?: Maybe<Array<Maybe<Partners_Mutation_Response>>>;
  /** update data of the table: "payments" */
  update_payments?: Maybe<Payments_Mutation_Response>;
  /** update single row of the table: "payments" */
  update_payments_by_pk?: Maybe<Payments>;
  /** update multiples rows of table: "payments" */
  update_payments_many?: Maybe<Array<Maybe<Payments_Mutation_Response>>>;
  /** update data of the table: "qr_codes" */
  update_qr_codes?: Maybe<Qr_Codes_Mutation_Response>;
  /** update single row of the table: "qr_codes" */
  update_qr_codes_by_pk?: Maybe<Qr_Codes>;
  /** update multiples rows of table: "qr_codes" */
  update_qr_codes_many?: Maybe<Array<Maybe<Qr_Codes_Mutation_Response>>>;
  /** update data of the table: "reviews" */
  update_reviews?: Maybe<Reviews_Mutation_Response>;
  /** update single row of the table: "reviews" */
  update_reviews_by_pk?: Maybe<Reviews>;
  /** update multiples rows of table: "reviews" */
  update_reviews_many?: Maybe<Array<Maybe<Reviews_Mutation_Response>>>;
  /** update data of the table: "users" */
  update_users?: Maybe<Users_Mutation_Response>;
  /** update single row of the table: "users" */
  update_users_by_pk?: Maybe<Users>;
  /** update multiples rows of table: "users" */
  update_users_many?: Maybe<Array<Maybe<Users_Mutation_Response>>>;
};


/** mutation root */
export type Mutation_RootDelete_CategoryArgs = {
  where: Category_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Category_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_Cravings_ItemsArgs = {
  where: Cravings_Items_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Cravings_Items_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_FollowersArgs = {
  where: Followers_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Followers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_MenuArgs = {
  where: Menu_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Menu_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_OffersArgs = {
  where: Offers_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Offers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_Offers_ClaimedArgs = {
  where: Offers_Claimed_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Offers_Claimed_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_PartnersArgs = {
  where: Partners_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Partners_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_PaymentsArgs = {
  where: Payments_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Payments_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_Qr_CodesArgs = {
  where: Qr_Codes_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Qr_Codes_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_ReviewsArgs = {
  where: Reviews_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Reviews_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootDelete_UsersArgs = {
  where: Users_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Users_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


/** mutation root */
export type Mutation_RootInsert_CategoryArgs = {
  objects: Array<Category_Insert_Input>;
  on_conflict?: InputMaybe<Category_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Category_OneArgs = {
  object: Category_Insert_Input;
  on_conflict?: InputMaybe<Category_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Cravings_ItemsArgs = {
  objects: Array<Cravings_Items_Insert_Input>;
  on_conflict?: InputMaybe<Cravings_Items_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Cravings_Items_OneArgs = {
  object: Cravings_Items_Insert_Input;
  on_conflict?: InputMaybe<Cravings_Items_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_FollowersArgs = {
  objects: Array<Followers_Insert_Input>;
  on_conflict?: InputMaybe<Followers_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Followers_OneArgs = {
  object: Followers_Insert_Input;
  on_conflict?: InputMaybe<Followers_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_MenuArgs = {
  objects: Array<Menu_Insert_Input>;
  on_conflict?: InputMaybe<Menu_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Menu_OneArgs = {
  object: Menu_Insert_Input;
  on_conflict?: InputMaybe<Menu_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_OffersArgs = {
  objects: Array<Offers_Insert_Input>;
  on_conflict?: InputMaybe<Offers_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Offers_ClaimedArgs = {
  objects: Array<Offers_Claimed_Insert_Input>;
  on_conflict?: InputMaybe<Offers_Claimed_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Offers_Claimed_OneArgs = {
  object: Offers_Claimed_Insert_Input;
  on_conflict?: InputMaybe<Offers_Claimed_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Offers_OneArgs = {
  object: Offers_Insert_Input;
  on_conflict?: InputMaybe<Offers_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_PartnersArgs = {
  objects: Array<Partners_Insert_Input>;
  on_conflict?: InputMaybe<Partners_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Partners_OneArgs = {
  object: Partners_Insert_Input;
  on_conflict?: InputMaybe<Partners_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_PaymentsArgs = {
  objects: Array<Payments_Insert_Input>;
  on_conflict?: InputMaybe<Payments_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Payments_OneArgs = {
  object: Payments_Insert_Input;
  on_conflict?: InputMaybe<Payments_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Qr_CodesArgs = {
  objects: Array<Qr_Codes_Insert_Input>;
  on_conflict?: InputMaybe<Qr_Codes_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Qr_Codes_OneArgs = {
  object: Qr_Codes_Insert_Input;
  on_conflict?: InputMaybe<Qr_Codes_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ReviewsArgs = {
  objects: Array<Reviews_Insert_Input>;
  on_conflict?: InputMaybe<Reviews_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Reviews_OneArgs = {
  object: Reviews_Insert_Input;
  on_conflict?: InputMaybe<Reviews_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_UsersArgs = {
  objects: Array<Users_Insert_Input>;
  on_conflict?: InputMaybe<Users_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Users_OneArgs = {
  object: Users_Insert_Input;
  on_conflict?: InputMaybe<Users_On_Conflict>;
};


/** mutation root */
export type Mutation_RootUpdate_CategoryArgs = {
  _set?: InputMaybe<Category_Set_Input>;
  where: Category_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Category_By_PkArgs = {
  _set?: InputMaybe<Category_Set_Input>;
  pk_columns: Category_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Category_ManyArgs = {
  updates: Array<Category_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_Cravings_ItemsArgs = {
  _set?: InputMaybe<Cravings_Items_Set_Input>;
  where: Cravings_Items_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Cravings_Items_By_PkArgs = {
  _set?: InputMaybe<Cravings_Items_Set_Input>;
  pk_columns: Cravings_Items_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Cravings_Items_ManyArgs = {
  updates: Array<Cravings_Items_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_FollowersArgs = {
  _set?: InputMaybe<Followers_Set_Input>;
  where: Followers_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Followers_By_PkArgs = {
  _set?: InputMaybe<Followers_Set_Input>;
  pk_columns: Followers_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Followers_ManyArgs = {
  updates: Array<Followers_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_MenuArgs = {
  _inc?: InputMaybe<Menu_Inc_Input>;
  _set?: InputMaybe<Menu_Set_Input>;
  where: Menu_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Menu_By_PkArgs = {
  _inc?: InputMaybe<Menu_Inc_Input>;
  _set?: InputMaybe<Menu_Set_Input>;
  pk_columns: Menu_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Menu_ManyArgs = {
  updates: Array<Menu_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_OffersArgs = {
  _inc?: InputMaybe<Offers_Inc_Input>;
  _set?: InputMaybe<Offers_Set_Input>;
  where: Offers_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Offers_By_PkArgs = {
  _inc?: InputMaybe<Offers_Inc_Input>;
  _set?: InputMaybe<Offers_Set_Input>;
  pk_columns: Offers_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Offers_ClaimedArgs = {
  _set?: InputMaybe<Offers_Claimed_Set_Input>;
  where: Offers_Claimed_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Offers_Claimed_By_PkArgs = {
  _set?: InputMaybe<Offers_Claimed_Set_Input>;
  pk_columns: Offers_Claimed_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Offers_Claimed_ManyArgs = {
  updates: Array<Offers_Claimed_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_Offers_ManyArgs = {
  updates: Array<Offers_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_PartnersArgs = {
  _set?: InputMaybe<Partners_Set_Input>;
  where: Partners_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Partners_By_PkArgs = {
  _set?: InputMaybe<Partners_Set_Input>;
  pk_columns: Partners_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Partners_ManyArgs = {
  updates: Array<Partners_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_PaymentsArgs = {
  _inc?: InputMaybe<Payments_Inc_Input>;
  _set?: InputMaybe<Payments_Set_Input>;
  where: Payments_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Payments_By_PkArgs = {
  _inc?: InputMaybe<Payments_Inc_Input>;
  _set?: InputMaybe<Payments_Set_Input>;
  pk_columns: Payments_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Payments_ManyArgs = {
  updates: Array<Payments_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_Qr_CodesArgs = {
  _inc?: InputMaybe<Qr_Codes_Inc_Input>;
  _set?: InputMaybe<Qr_Codes_Set_Input>;
  where: Qr_Codes_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Qr_Codes_By_PkArgs = {
  _inc?: InputMaybe<Qr_Codes_Inc_Input>;
  _set?: InputMaybe<Qr_Codes_Set_Input>;
  pk_columns: Qr_Codes_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Qr_Codes_ManyArgs = {
  updates: Array<Qr_Codes_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_ReviewsArgs = {
  _inc?: InputMaybe<Reviews_Inc_Input>;
  _set?: InputMaybe<Reviews_Set_Input>;
  where: Reviews_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Reviews_By_PkArgs = {
  _inc?: InputMaybe<Reviews_Inc_Input>;
  _set?: InputMaybe<Reviews_Set_Input>;
  pk_columns: Reviews_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Reviews_ManyArgs = {
  updates: Array<Reviews_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_UsersArgs = {
  _inc?: InputMaybe<Users_Inc_Input>;
  _set?: InputMaybe<Users_Set_Input>;
  where: Users_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Users_By_PkArgs = {
  _inc?: InputMaybe<Users_Inc_Input>;
  _set?: InputMaybe<Users_Set_Input>;
  pk_columns: Users_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Users_ManyArgs = {
  updates: Array<Users_Updates>;
};

/** columns and relationships of "offers" */
export type Offers = {
  __typename?: 'offers';
  created_at: Scalars['date']['output'];
  description: Scalars['String']['output'];
  end_time: Scalars['date']['output'];
  enquiries: Scalars['Int']['output'];
  id: Scalars['uuid']['output'];
  image_url: Scalars['String']['output'];
  items_available: Scalars['Int']['output'];
  menu_item_id: Scalars['uuid']['output'];
  offer_price: Scalars['Int']['output'];
  partner_id: Scalars['uuid']['output'];
  start_time: Scalars['date']['output'];
};

/** aggregated selection of "offers" */
export type Offers_Aggregate = {
  __typename?: 'offers_aggregate';
  aggregate?: Maybe<Offers_Aggregate_Fields>;
  nodes: Array<Offers>;
};

/** aggregate fields of "offers" */
export type Offers_Aggregate_Fields = {
  __typename?: 'offers_aggregate_fields';
  avg?: Maybe<Offers_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Offers_Max_Fields>;
  min?: Maybe<Offers_Min_Fields>;
  stddev?: Maybe<Offers_Stddev_Fields>;
  stddev_pop?: Maybe<Offers_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Offers_Stddev_Samp_Fields>;
  sum?: Maybe<Offers_Sum_Fields>;
  var_pop?: Maybe<Offers_Var_Pop_Fields>;
  var_samp?: Maybe<Offers_Var_Samp_Fields>;
  variance?: Maybe<Offers_Variance_Fields>;
};


/** aggregate fields of "offers" */
export type Offers_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Offers_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Offers_Avg_Fields = {
  __typename?: 'offers_avg_fields';
  enquiries?: Maybe<Scalars['Float']['output']>;
  items_available?: Maybe<Scalars['Float']['output']>;
  offer_price?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "offers". All fields are combined with a logical 'AND'. */
export type Offers_Bool_Exp = {
  _and?: InputMaybe<Array<Offers_Bool_Exp>>;
  _not?: InputMaybe<Offers_Bool_Exp>;
  _or?: InputMaybe<Array<Offers_Bool_Exp>>;
  created_at?: InputMaybe<Date_Comparison_Exp>;
  description?: InputMaybe<String_Comparison_Exp>;
  end_time?: InputMaybe<Date_Comparison_Exp>;
  enquiries?: InputMaybe<Int_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  image_url?: InputMaybe<String_Comparison_Exp>;
  items_available?: InputMaybe<Int_Comparison_Exp>;
  menu_item_id?: InputMaybe<Uuid_Comparison_Exp>;
  offer_price?: InputMaybe<Int_Comparison_Exp>;
  partner_id?: InputMaybe<Uuid_Comparison_Exp>;
  start_time?: InputMaybe<Date_Comparison_Exp>;
};

/** offers claimed by an user */
export type Offers_Claimed = {
  __typename?: 'offers_claimed';
  claimed_time: Scalars['date']['output'];
  id: Scalars['uuid']['output'];
  offer_id: Scalars['uuid']['output'];
  partner_id: Scalars['uuid']['output'];
  user_id: Scalars['uuid']['output'];
};

/** aggregated selection of "offers_claimed" */
export type Offers_Claimed_Aggregate = {
  __typename?: 'offers_claimed_aggregate';
  aggregate?: Maybe<Offers_Claimed_Aggregate_Fields>;
  nodes: Array<Offers_Claimed>;
};

/** aggregate fields of "offers_claimed" */
export type Offers_Claimed_Aggregate_Fields = {
  __typename?: 'offers_claimed_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Offers_Claimed_Max_Fields>;
  min?: Maybe<Offers_Claimed_Min_Fields>;
};


/** aggregate fields of "offers_claimed" */
export type Offers_Claimed_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Offers_Claimed_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "offers_claimed". All fields are combined with a logical 'AND'. */
export type Offers_Claimed_Bool_Exp = {
  _and?: InputMaybe<Array<Offers_Claimed_Bool_Exp>>;
  _not?: InputMaybe<Offers_Claimed_Bool_Exp>;
  _or?: InputMaybe<Array<Offers_Claimed_Bool_Exp>>;
  claimed_time?: InputMaybe<Date_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  offer_id?: InputMaybe<Uuid_Comparison_Exp>;
  partner_id?: InputMaybe<Uuid_Comparison_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "offers_claimed" */
export enum Offers_Claimed_Constraint {
  /** unique or primary key constraint on columns "id" */
  OffersClaimedPkey = 'offers_claimed_pkey'
}

/** input type for inserting data into table "offers_claimed" */
export type Offers_Claimed_Insert_Input = {
  claimed_time?: InputMaybe<Scalars['date']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  offer_id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Offers_Claimed_Max_Fields = {
  __typename?: 'offers_claimed_max_fields';
  claimed_time?: Maybe<Scalars['date']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  offer_id?: Maybe<Scalars['uuid']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** aggregate min on columns */
export type Offers_Claimed_Min_Fields = {
  __typename?: 'offers_claimed_min_fields';
  claimed_time?: Maybe<Scalars['date']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  offer_id?: Maybe<Scalars['uuid']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** response of any mutation on the table "offers_claimed" */
export type Offers_Claimed_Mutation_Response = {
  __typename?: 'offers_claimed_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Offers_Claimed>;
};

/** on_conflict condition type for table "offers_claimed" */
export type Offers_Claimed_On_Conflict = {
  constraint: Offers_Claimed_Constraint;
  update_columns?: Array<Offers_Claimed_Update_Column>;
  where?: InputMaybe<Offers_Claimed_Bool_Exp>;
};

/** Ordering options when selecting data from "offers_claimed". */
export type Offers_Claimed_Order_By = {
  claimed_time?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  offer_id?: InputMaybe<Order_By>;
  partner_id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: offers_claimed */
export type Offers_Claimed_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "offers_claimed" */
export enum Offers_Claimed_Select_Column {
  /** column name */
  ClaimedTime = 'claimed_time',
  /** column name */
  Id = 'id',
  /** column name */
  OfferId = 'offer_id',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  UserId = 'user_id'
}

/** input type for updating data in table "offers_claimed" */
export type Offers_Claimed_Set_Input = {
  claimed_time?: InputMaybe<Scalars['date']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  offer_id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** Streaming cursor of the table "offers_claimed" */
export type Offers_Claimed_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Offers_Claimed_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Offers_Claimed_Stream_Cursor_Value_Input = {
  claimed_time?: InputMaybe<Scalars['date']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  offer_id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** update columns of table "offers_claimed" */
export enum Offers_Claimed_Update_Column {
  /** column name */
  ClaimedTime = 'claimed_time',
  /** column name */
  Id = 'id',
  /** column name */
  OfferId = 'offer_id',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  UserId = 'user_id'
}

export type Offers_Claimed_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Offers_Claimed_Set_Input>;
  /** filter the rows which have to be updated */
  where: Offers_Claimed_Bool_Exp;
};

/** unique or primary key constraints on table "offers" */
export enum Offers_Constraint {
  /** unique or primary key constraint on columns "id" */
  OffersPkey = 'offers_pkey'
}

/** input type for incrementing numeric columns in table "offers" */
export type Offers_Inc_Input = {
  enquiries?: InputMaybe<Scalars['Int']['input']>;
  items_available?: InputMaybe<Scalars['Int']['input']>;
  offer_price?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "offers" */
export type Offers_Insert_Input = {
  created_at?: InputMaybe<Scalars['date']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  end_time?: InputMaybe<Scalars['date']['input']>;
  enquiries?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  items_available?: InputMaybe<Scalars['Int']['input']>;
  menu_item_id?: InputMaybe<Scalars['uuid']['input']>;
  offer_price?: InputMaybe<Scalars['Int']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  start_time?: InputMaybe<Scalars['date']['input']>;
};

/** aggregate max on columns */
export type Offers_Max_Fields = {
  __typename?: 'offers_max_fields';
  created_at?: Maybe<Scalars['date']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  end_time?: Maybe<Scalars['date']['output']>;
  enquiries?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  image_url?: Maybe<Scalars['String']['output']>;
  items_available?: Maybe<Scalars['Int']['output']>;
  menu_item_id?: Maybe<Scalars['uuid']['output']>;
  offer_price?: Maybe<Scalars['Int']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  start_time?: Maybe<Scalars['date']['output']>;
};

/** aggregate min on columns */
export type Offers_Min_Fields = {
  __typename?: 'offers_min_fields';
  created_at?: Maybe<Scalars['date']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  end_time?: Maybe<Scalars['date']['output']>;
  enquiries?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  image_url?: Maybe<Scalars['String']['output']>;
  items_available?: Maybe<Scalars['Int']['output']>;
  menu_item_id?: Maybe<Scalars['uuid']['output']>;
  offer_price?: Maybe<Scalars['Int']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  start_time?: Maybe<Scalars['date']['output']>;
};

/** response of any mutation on the table "offers" */
export type Offers_Mutation_Response = {
  __typename?: 'offers_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Offers>;
};

/** on_conflict condition type for table "offers" */
export type Offers_On_Conflict = {
  constraint: Offers_Constraint;
  update_columns?: Array<Offers_Update_Column>;
  where?: InputMaybe<Offers_Bool_Exp>;
};

/** Ordering options when selecting data from "offers". */
export type Offers_Order_By = {
  created_at?: InputMaybe<Order_By>;
  description?: InputMaybe<Order_By>;
  end_time?: InputMaybe<Order_By>;
  enquiries?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  image_url?: InputMaybe<Order_By>;
  items_available?: InputMaybe<Order_By>;
  menu_item_id?: InputMaybe<Order_By>;
  offer_price?: InputMaybe<Order_By>;
  partner_id?: InputMaybe<Order_By>;
  start_time?: InputMaybe<Order_By>;
};

/** primary key columns input for table: offers */
export type Offers_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "offers" */
export enum Offers_Select_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Description = 'description',
  /** column name */
  EndTime = 'end_time',
  /** column name */
  Enquiries = 'enquiries',
  /** column name */
  Id = 'id',
  /** column name */
  ImageUrl = 'image_url',
  /** column name */
  ItemsAvailable = 'items_available',
  /** column name */
  MenuItemId = 'menu_item_id',
  /** column name */
  OfferPrice = 'offer_price',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  StartTime = 'start_time'
}

/** input type for updating data in table "offers" */
export type Offers_Set_Input = {
  created_at?: InputMaybe<Scalars['date']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  end_time?: InputMaybe<Scalars['date']['input']>;
  enquiries?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  items_available?: InputMaybe<Scalars['Int']['input']>;
  menu_item_id?: InputMaybe<Scalars['uuid']['input']>;
  offer_price?: InputMaybe<Scalars['Int']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  start_time?: InputMaybe<Scalars['date']['input']>;
};

/** aggregate stddev on columns */
export type Offers_Stddev_Fields = {
  __typename?: 'offers_stddev_fields';
  enquiries?: Maybe<Scalars['Float']['output']>;
  items_available?: Maybe<Scalars['Float']['output']>;
  offer_price?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Offers_Stddev_Pop_Fields = {
  __typename?: 'offers_stddev_pop_fields';
  enquiries?: Maybe<Scalars['Float']['output']>;
  items_available?: Maybe<Scalars['Float']['output']>;
  offer_price?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Offers_Stddev_Samp_Fields = {
  __typename?: 'offers_stddev_samp_fields';
  enquiries?: Maybe<Scalars['Float']['output']>;
  items_available?: Maybe<Scalars['Float']['output']>;
  offer_price?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "offers" */
export type Offers_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Offers_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Offers_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['date']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  end_time?: InputMaybe<Scalars['date']['input']>;
  enquiries?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  items_available?: InputMaybe<Scalars['Int']['input']>;
  menu_item_id?: InputMaybe<Scalars['uuid']['input']>;
  offer_price?: InputMaybe<Scalars['Int']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  start_time?: InputMaybe<Scalars['date']['input']>;
};

/** aggregate sum on columns */
export type Offers_Sum_Fields = {
  __typename?: 'offers_sum_fields';
  enquiries?: Maybe<Scalars['Int']['output']>;
  items_available?: Maybe<Scalars['Int']['output']>;
  offer_price?: Maybe<Scalars['Int']['output']>;
};

/** update columns of table "offers" */
export enum Offers_Update_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Description = 'description',
  /** column name */
  EndTime = 'end_time',
  /** column name */
  Enquiries = 'enquiries',
  /** column name */
  Id = 'id',
  /** column name */
  ImageUrl = 'image_url',
  /** column name */
  ItemsAvailable = 'items_available',
  /** column name */
  MenuItemId = 'menu_item_id',
  /** column name */
  OfferPrice = 'offer_price',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  StartTime = 'start_time'
}

export type Offers_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Offers_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Offers_Set_Input>;
  /** filter the rows which have to be updated */
  where: Offers_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Offers_Var_Pop_Fields = {
  __typename?: 'offers_var_pop_fields';
  enquiries?: Maybe<Scalars['Float']['output']>;
  items_available?: Maybe<Scalars['Float']['output']>;
  offer_price?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Offers_Var_Samp_Fields = {
  __typename?: 'offers_var_samp_fields';
  enquiries?: Maybe<Scalars['Float']['output']>;
  items_available?: Maybe<Scalars['Float']['output']>;
  offer_price?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Offers_Variance_Fields = {
  __typename?: 'offers_variance_fields';
  enquiries?: Maybe<Scalars['Float']['output']>;
  items_available?: Maybe<Scalars['Float']['output']>;
  offer_price?: Maybe<Scalars['Float']['output']>;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = 'asc',
  /** in ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in descending order, nulls first */
  Desc = 'desc',
  /** in descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in descending order, nulls last */
  DescNullsLast = 'desc_nulls_last'
}

/** business partners */
export type Partners = {
  __typename?: 'partners';
  description: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['uuid']['output'];
  location: Scalars['String']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
  store_name: Scalars['String']['output'];
  upi_id: Scalars['String']['output'];
};

/** aggregated selection of "partners" */
export type Partners_Aggregate = {
  __typename?: 'partners_aggregate';
  aggregate?: Maybe<Partners_Aggregate_Fields>;
  nodes: Array<Partners>;
};

/** aggregate fields of "partners" */
export type Partners_Aggregate_Fields = {
  __typename?: 'partners_aggregate_fields';
  count: Scalars['Int']['output'];
  max?: Maybe<Partners_Max_Fields>;
  min?: Maybe<Partners_Min_Fields>;
};


/** aggregate fields of "partners" */
export type Partners_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Partners_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Boolean expression to filter rows from the table "partners". All fields are combined with a logical 'AND'. */
export type Partners_Bool_Exp = {
  _and?: InputMaybe<Array<Partners_Bool_Exp>>;
  _not?: InputMaybe<Partners_Bool_Exp>;
  _or?: InputMaybe<Array<Partners_Bool_Exp>>;
  description?: InputMaybe<String_Comparison_Exp>;
  email?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  location?: InputMaybe<String_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  status?: InputMaybe<String_Comparison_Exp>;
  store_name?: InputMaybe<String_Comparison_Exp>;
  upi_id?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "partners" */
export enum Partners_Constraint {
  /** unique or primary key constraint on columns "id" */
  PartnersPkey = 'partners_pkey'
}

/** input type for inserting data into table "partners" */
export type Partners_Insert_Input = {
  description?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  store_name?: InputMaybe<Scalars['String']['input']>;
  upi_id?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Partners_Max_Fields = {
  __typename?: 'partners_max_fields';
  description?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  store_name?: Maybe<Scalars['String']['output']>;
  upi_id?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Partners_Min_Fields = {
  __typename?: 'partners_min_fields';
  description?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  store_name?: Maybe<Scalars['String']['output']>;
  upi_id?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "partners" */
export type Partners_Mutation_Response = {
  __typename?: 'partners_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Partners>;
};

/** on_conflict condition type for table "partners" */
export type Partners_On_Conflict = {
  constraint: Partners_Constraint;
  update_columns?: Array<Partners_Update_Column>;
  where?: InputMaybe<Partners_Bool_Exp>;
};

/** Ordering options when selecting data from "partners". */
export type Partners_Order_By = {
  description?: InputMaybe<Order_By>;
  email?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  location?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  status?: InputMaybe<Order_By>;
  store_name?: InputMaybe<Order_By>;
  upi_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: partners */
export type Partners_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "partners" */
export enum Partners_Select_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Email = 'email',
  /** column name */
  Id = 'id',
  /** column name */
  Location = 'location',
  /** column name */
  Name = 'name',
  /** column name */
  Status = 'status',
  /** column name */
  StoreName = 'store_name',
  /** column name */
  UpiId = 'upi_id'
}

/** input type for updating data in table "partners" */
export type Partners_Set_Input = {
  description?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  store_name?: InputMaybe<Scalars['String']['input']>;
  upi_id?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "partners" */
export type Partners_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Partners_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Partners_Stream_Cursor_Value_Input = {
  description?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  store_name?: InputMaybe<Scalars['String']['input']>;
  upi_id?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "partners" */
export enum Partners_Update_Column {
  /** column name */
  Description = 'description',
  /** column name */
  Email = 'email',
  /** column name */
  Id = 'id',
  /** column name */
  Location = 'location',
  /** column name */
  Name = 'name',
  /** column name */
  Status = 'status',
  /** column name */
  StoreName = 'store_name',
  /** column name */
  UpiId = 'upi_id'
}

export type Partners_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Partners_Set_Input>;
  /** filter the rows which have to be updated */
  where: Partners_Bool_Exp;
};

/** payments from partners */
export type Payments = {
  __typename?: 'payments';
  amount: Scalars['Int']['output'];
  id: Scalars['uuid']['output'];
  partner_id: Scalars['uuid']['output'];
  payment_date: Scalars['date']['output'];
  reference: Scalars['String']['output'];
};

/** aggregated selection of "payments" */
export type Payments_Aggregate = {
  __typename?: 'payments_aggregate';
  aggregate?: Maybe<Payments_Aggregate_Fields>;
  nodes: Array<Payments>;
};

/** aggregate fields of "payments" */
export type Payments_Aggregate_Fields = {
  __typename?: 'payments_aggregate_fields';
  avg?: Maybe<Payments_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Payments_Max_Fields>;
  min?: Maybe<Payments_Min_Fields>;
  stddev?: Maybe<Payments_Stddev_Fields>;
  stddev_pop?: Maybe<Payments_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Payments_Stddev_Samp_Fields>;
  sum?: Maybe<Payments_Sum_Fields>;
  var_pop?: Maybe<Payments_Var_Pop_Fields>;
  var_samp?: Maybe<Payments_Var_Samp_Fields>;
  variance?: Maybe<Payments_Variance_Fields>;
};


/** aggregate fields of "payments" */
export type Payments_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Payments_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Payments_Avg_Fields = {
  __typename?: 'payments_avg_fields';
  amount?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "payments". All fields are combined with a logical 'AND'. */
export type Payments_Bool_Exp = {
  _and?: InputMaybe<Array<Payments_Bool_Exp>>;
  _not?: InputMaybe<Payments_Bool_Exp>;
  _or?: InputMaybe<Array<Payments_Bool_Exp>>;
  amount?: InputMaybe<Int_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  partner_id?: InputMaybe<Uuid_Comparison_Exp>;
  payment_date?: InputMaybe<Date_Comparison_Exp>;
  reference?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "payments" */
export enum Payments_Constraint {
  /** unique or primary key constraint on columns "id" */
  PaymentsPkey = 'payments_pkey'
}

/** input type for incrementing numeric columns in table "payments" */
export type Payments_Inc_Input = {
  amount?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "payments" */
export type Payments_Insert_Input = {
  amount?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  payment_date?: InputMaybe<Scalars['date']['input']>;
  reference?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Payments_Max_Fields = {
  __typename?: 'payments_max_fields';
  amount?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  payment_date?: Maybe<Scalars['date']['output']>;
  reference?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Payments_Min_Fields = {
  __typename?: 'payments_min_fields';
  amount?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  payment_date?: Maybe<Scalars['date']['output']>;
  reference?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "payments" */
export type Payments_Mutation_Response = {
  __typename?: 'payments_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Payments>;
};

/** on_conflict condition type for table "payments" */
export type Payments_On_Conflict = {
  constraint: Payments_Constraint;
  update_columns?: Array<Payments_Update_Column>;
  where?: InputMaybe<Payments_Bool_Exp>;
};

/** Ordering options when selecting data from "payments". */
export type Payments_Order_By = {
  amount?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  partner_id?: InputMaybe<Order_By>;
  payment_date?: InputMaybe<Order_By>;
  reference?: InputMaybe<Order_By>;
};

/** primary key columns input for table: payments */
export type Payments_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "payments" */
export enum Payments_Select_Column {
  /** column name */
  Amount = 'amount',
  /** column name */
  Id = 'id',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  PaymentDate = 'payment_date',
  /** column name */
  Reference = 'reference'
}

/** input type for updating data in table "payments" */
export type Payments_Set_Input = {
  amount?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  payment_date?: InputMaybe<Scalars['date']['input']>;
  reference?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate stddev on columns */
export type Payments_Stddev_Fields = {
  __typename?: 'payments_stddev_fields';
  amount?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Payments_Stddev_Pop_Fields = {
  __typename?: 'payments_stddev_pop_fields';
  amount?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Payments_Stddev_Samp_Fields = {
  __typename?: 'payments_stddev_samp_fields';
  amount?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "payments" */
export type Payments_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Payments_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Payments_Stream_Cursor_Value_Input = {
  amount?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  payment_date?: InputMaybe<Scalars['date']['input']>;
  reference?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type Payments_Sum_Fields = {
  __typename?: 'payments_sum_fields';
  amount?: Maybe<Scalars['Int']['output']>;
};

/** update columns of table "payments" */
export enum Payments_Update_Column {
  /** column name */
  Amount = 'amount',
  /** column name */
  Id = 'id',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  PaymentDate = 'payment_date',
  /** column name */
  Reference = 'reference'
}

export type Payments_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Payments_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Payments_Set_Input>;
  /** filter the rows which have to be updated */
  where: Payments_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Payments_Var_Pop_Fields = {
  __typename?: 'payments_var_pop_fields';
  amount?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Payments_Var_Samp_Fields = {
  __typename?: 'payments_var_samp_fields';
  amount?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Payments_Variance_Fields = {
  __typename?: 'payments_variance_fields';
  amount?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "qr_codes" */
export type Qr_Codes = {
  __typename?: 'qr_codes';
  id: Scalars['uuid']['output'];
  no_of_scans: Scalars['Int']['output'];
  partner_id: Scalars['uuid']['output'];
  qr_number: Scalars['Int']['output'];
};

/** aggregated selection of "qr_codes" */
export type Qr_Codes_Aggregate = {
  __typename?: 'qr_codes_aggregate';
  aggregate?: Maybe<Qr_Codes_Aggregate_Fields>;
  nodes: Array<Qr_Codes>;
};

/** aggregate fields of "qr_codes" */
export type Qr_Codes_Aggregate_Fields = {
  __typename?: 'qr_codes_aggregate_fields';
  avg?: Maybe<Qr_Codes_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Qr_Codes_Max_Fields>;
  min?: Maybe<Qr_Codes_Min_Fields>;
  stddev?: Maybe<Qr_Codes_Stddev_Fields>;
  stddev_pop?: Maybe<Qr_Codes_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Qr_Codes_Stddev_Samp_Fields>;
  sum?: Maybe<Qr_Codes_Sum_Fields>;
  var_pop?: Maybe<Qr_Codes_Var_Pop_Fields>;
  var_samp?: Maybe<Qr_Codes_Var_Samp_Fields>;
  variance?: Maybe<Qr_Codes_Variance_Fields>;
};


/** aggregate fields of "qr_codes" */
export type Qr_Codes_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Qr_Codes_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Qr_Codes_Avg_Fields = {
  __typename?: 'qr_codes_avg_fields';
  no_of_scans?: Maybe<Scalars['Float']['output']>;
  qr_number?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "qr_codes". All fields are combined with a logical 'AND'. */
export type Qr_Codes_Bool_Exp = {
  _and?: InputMaybe<Array<Qr_Codes_Bool_Exp>>;
  _not?: InputMaybe<Qr_Codes_Bool_Exp>;
  _or?: InputMaybe<Array<Qr_Codes_Bool_Exp>>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  no_of_scans?: InputMaybe<Int_Comparison_Exp>;
  partner_id?: InputMaybe<Uuid_Comparison_Exp>;
  qr_number?: InputMaybe<Int_Comparison_Exp>;
};

/** unique or primary key constraints on table "qr_codes" */
export enum Qr_Codes_Constraint {
  /** unique or primary key constraint on columns "id" */
  QrCodesPkey = 'qr_codes_pkey'
}

/** input type for incrementing numeric columns in table "qr_codes" */
export type Qr_Codes_Inc_Input = {
  no_of_scans?: InputMaybe<Scalars['Int']['input']>;
  qr_number?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "qr_codes" */
export type Qr_Codes_Insert_Input = {
  id?: InputMaybe<Scalars['uuid']['input']>;
  no_of_scans?: InputMaybe<Scalars['Int']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  qr_number?: InputMaybe<Scalars['Int']['input']>;
};

/** aggregate max on columns */
export type Qr_Codes_Max_Fields = {
  __typename?: 'qr_codes_max_fields';
  id?: Maybe<Scalars['uuid']['output']>;
  no_of_scans?: Maybe<Scalars['Int']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  qr_number?: Maybe<Scalars['Int']['output']>;
};

/** aggregate min on columns */
export type Qr_Codes_Min_Fields = {
  __typename?: 'qr_codes_min_fields';
  id?: Maybe<Scalars['uuid']['output']>;
  no_of_scans?: Maybe<Scalars['Int']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  qr_number?: Maybe<Scalars['Int']['output']>;
};

/** response of any mutation on the table "qr_codes" */
export type Qr_Codes_Mutation_Response = {
  __typename?: 'qr_codes_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Qr_Codes>;
};

/** on_conflict condition type for table "qr_codes" */
export type Qr_Codes_On_Conflict = {
  constraint: Qr_Codes_Constraint;
  update_columns?: Array<Qr_Codes_Update_Column>;
  where?: InputMaybe<Qr_Codes_Bool_Exp>;
};

/** Ordering options when selecting data from "qr_codes". */
export type Qr_Codes_Order_By = {
  id?: InputMaybe<Order_By>;
  no_of_scans?: InputMaybe<Order_By>;
  partner_id?: InputMaybe<Order_By>;
  qr_number?: InputMaybe<Order_By>;
};

/** primary key columns input for table: qr_codes */
export type Qr_Codes_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "qr_codes" */
export enum Qr_Codes_Select_Column {
  /** column name */
  Id = 'id',
  /** column name */
  NoOfScans = 'no_of_scans',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  QrNumber = 'qr_number'
}

/** input type for updating data in table "qr_codes" */
export type Qr_Codes_Set_Input = {
  id?: InputMaybe<Scalars['uuid']['input']>;
  no_of_scans?: InputMaybe<Scalars['Int']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  qr_number?: InputMaybe<Scalars['Int']['input']>;
};

/** aggregate stddev on columns */
export type Qr_Codes_Stddev_Fields = {
  __typename?: 'qr_codes_stddev_fields';
  no_of_scans?: Maybe<Scalars['Float']['output']>;
  qr_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Qr_Codes_Stddev_Pop_Fields = {
  __typename?: 'qr_codes_stddev_pop_fields';
  no_of_scans?: Maybe<Scalars['Float']['output']>;
  qr_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Qr_Codes_Stddev_Samp_Fields = {
  __typename?: 'qr_codes_stddev_samp_fields';
  no_of_scans?: Maybe<Scalars['Float']['output']>;
  qr_number?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "qr_codes" */
export type Qr_Codes_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Qr_Codes_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Qr_Codes_Stream_Cursor_Value_Input = {
  id?: InputMaybe<Scalars['uuid']['input']>;
  no_of_scans?: InputMaybe<Scalars['Int']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  qr_number?: InputMaybe<Scalars['Int']['input']>;
};

/** aggregate sum on columns */
export type Qr_Codes_Sum_Fields = {
  __typename?: 'qr_codes_sum_fields';
  no_of_scans?: Maybe<Scalars['Int']['output']>;
  qr_number?: Maybe<Scalars['Int']['output']>;
};

/** update columns of table "qr_codes" */
export enum Qr_Codes_Update_Column {
  /** column name */
  Id = 'id',
  /** column name */
  NoOfScans = 'no_of_scans',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  QrNumber = 'qr_number'
}

export type Qr_Codes_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Qr_Codes_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Qr_Codes_Set_Input>;
  /** filter the rows which have to be updated */
  where: Qr_Codes_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Qr_Codes_Var_Pop_Fields = {
  __typename?: 'qr_codes_var_pop_fields';
  no_of_scans?: Maybe<Scalars['Float']['output']>;
  qr_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Qr_Codes_Var_Samp_Fields = {
  __typename?: 'qr_codes_var_samp_fields';
  no_of_scans?: Maybe<Scalars['Float']['output']>;
  qr_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Qr_Codes_Variance_Fields = {
  __typename?: 'qr_codes_variance_fields';
  no_of_scans?: Maybe<Scalars['Float']['output']>;
  qr_number?: Maybe<Scalars['Float']['output']>;
};

export type Query_Root = {
  __typename?: 'query_root';
  /** fetch data from the table: "category" */
  category: Array<Category>;
  /** fetch aggregated fields from the table: "category" */
  category_aggregate: Category_Aggregate;
  /** fetch data from the table: "category" using primary key columns */
  category_by_pk?: Maybe<Category>;
  /** fetch data from the table: "cravings_items" */
  cravings_items: Array<Cravings_Items>;
  /** fetch aggregated fields from the table: "cravings_items" */
  cravings_items_aggregate: Cravings_Items_Aggregate;
  /** fetch data from the table: "cravings_items" using primary key columns */
  cravings_items_by_pk?: Maybe<Cravings_Items>;
  /** fetch data from the table: "followers" */
  followers: Array<Followers>;
  /** fetch aggregated fields from the table: "followers" */
  followers_aggregate: Followers_Aggregate;
  /** fetch data from the table: "followers" using primary key columns */
  followers_by_pk?: Maybe<Followers>;
  /** fetch data from the table: "menu" */
  menu: Array<Menu>;
  /** fetch aggregated fields from the table: "menu" */
  menu_aggregate: Menu_Aggregate;
  /** fetch data from the table: "menu" using primary key columns */
  menu_by_pk?: Maybe<Menu>;
  /** fetch data from the table: "offers" */
  offers: Array<Offers>;
  /** fetch aggregated fields from the table: "offers" */
  offers_aggregate: Offers_Aggregate;
  /** fetch data from the table: "offers" using primary key columns */
  offers_by_pk?: Maybe<Offers>;
  /** fetch data from the table: "offers_claimed" */
  offers_claimed: Array<Offers_Claimed>;
  /** fetch aggregated fields from the table: "offers_claimed" */
  offers_claimed_aggregate: Offers_Claimed_Aggregate;
  /** fetch data from the table: "offers_claimed" using primary key columns */
  offers_claimed_by_pk?: Maybe<Offers_Claimed>;
  /** fetch data from the table: "partners" */
  partners: Array<Partners>;
  /** fetch aggregated fields from the table: "partners" */
  partners_aggregate: Partners_Aggregate;
  /** fetch data from the table: "partners" using primary key columns */
  partners_by_pk?: Maybe<Partners>;
  /** fetch data from the table: "payments" */
  payments: Array<Payments>;
  /** fetch aggregated fields from the table: "payments" */
  payments_aggregate: Payments_Aggregate;
  /** fetch data from the table: "payments" using primary key columns */
  payments_by_pk?: Maybe<Payments>;
  /** fetch data from the table: "qr_codes" */
  qr_codes: Array<Qr_Codes>;
  /** fetch aggregated fields from the table: "qr_codes" */
  qr_codes_aggregate: Qr_Codes_Aggregate;
  /** fetch data from the table: "qr_codes" using primary key columns */
  qr_codes_by_pk?: Maybe<Qr_Codes>;
  /** fetch data from the table: "reviews" */
  reviews: Array<Reviews>;
  /** fetch aggregated fields from the table: "reviews" */
  reviews_aggregate: Reviews_Aggregate;
  /** fetch data from the table: "reviews" using primary key columns */
  reviews_by_pk?: Maybe<Reviews>;
  /** fetch data from the table: "users" */
  users: Array<Users>;
  /** fetch aggregated fields from the table: "users" */
  users_aggregate: Users_Aggregate;
  /** fetch data from the table: "users" using primary key columns */
  users_by_pk?: Maybe<Users>;
};


export type Query_RootCategoryArgs = {
  distinct_on?: InputMaybe<Array<Category_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Category_Order_By>>;
  where?: InputMaybe<Category_Bool_Exp>;
};


export type Query_RootCategory_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Category_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Category_Order_By>>;
  where?: InputMaybe<Category_Bool_Exp>;
};


export type Query_RootCategory_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootCravings_ItemsArgs = {
  distinct_on?: InputMaybe<Array<Cravings_Items_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Cravings_Items_Order_By>>;
  where?: InputMaybe<Cravings_Items_Bool_Exp>;
};


export type Query_RootCravings_Items_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Cravings_Items_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Cravings_Items_Order_By>>;
  where?: InputMaybe<Cravings_Items_Bool_Exp>;
};


export type Query_RootCravings_Items_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootFollowersArgs = {
  distinct_on?: InputMaybe<Array<Followers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Followers_Order_By>>;
  where?: InputMaybe<Followers_Bool_Exp>;
};


export type Query_RootFollowers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Followers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Followers_Order_By>>;
  where?: InputMaybe<Followers_Bool_Exp>;
};


export type Query_RootFollowers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootMenuArgs = {
  distinct_on?: InputMaybe<Array<Menu_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Menu_Order_By>>;
  where?: InputMaybe<Menu_Bool_Exp>;
};


export type Query_RootMenu_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Menu_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Menu_Order_By>>;
  where?: InputMaybe<Menu_Bool_Exp>;
};


export type Query_RootMenu_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootOffersArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Offers_Order_By>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};


export type Query_RootOffers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Offers_Order_By>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};


export type Query_RootOffers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootOffers_ClaimedArgs = {
  distinct_on?: InputMaybe<Array<Offers_Claimed_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Offers_Claimed_Order_By>>;
  where?: InputMaybe<Offers_Claimed_Bool_Exp>;
};


export type Query_RootOffers_Claimed_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Offers_Claimed_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Offers_Claimed_Order_By>>;
  where?: InputMaybe<Offers_Claimed_Bool_Exp>;
};


export type Query_RootOffers_Claimed_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootPartnersArgs = {
  distinct_on?: InputMaybe<Array<Partners_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Partners_Order_By>>;
  where?: InputMaybe<Partners_Bool_Exp>;
};


export type Query_RootPartners_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Partners_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Partners_Order_By>>;
  where?: InputMaybe<Partners_Bool_Exp>;
};


export type Query_RootPartners_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootPaymentsArgs = {
  distinct_on?: InputMaybe<Array<Payments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Payments_Order_By>>;
  where?: InputMaybe<Payments_Bool_Exp>;
};


export type Query_RootPayments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Payments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Payments_Order_By>>;
  where?: InputMaybe<Payments_Bool_Exp>;
};


export type Query_RootPayments_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootQr_CodesArgs = {
  distinct_on?: InputMaybe<Array<Qr_Codes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Qr_Codes_Order_By>>;
  where?: InputMaybe<Qr_Codes_Bool_Exp>;
};


export type Query_RootQr_Codes_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Qr_Codes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Qr_Codes_Order_By>>;
  where?: InputMaybe<Qr_Codes_Bool_Exp>;
};


export type Query_RootQr_Codes_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootReviewsArgs = {
  distinct_on?: InputMaybe<Array<Reviews_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Reviews_Order_By>>;
  where?: InputMaybe<Reviews_Bool_Exp>;
};


export type Query_RootReviews_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Reviews_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Reviews_Order_By>>;
  where?: InputMaybe<Reviews_Bool_Exp>;
};


export type Query_RootReviews_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootUsersArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};


export type Query_RootUsers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};


export type Query_RootUsers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};

/** both store review and item review */
export type Reviews = {
  __typename?: 'reviews';
  comment: Scalars['String']['output'];
  created_at: Scalars['date']['output'];
  id: Scalars['uuid']['output'];
  menu_id?: Maybe<Scalars['uuid']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  rating: Scalars['Int']['output'];
  type: Scalars['String']['output'];
  user_id: Scalars['uuid']['output'];
};

/** aggregated selection of "reviews" */
export type Reviews_Aggregate = {
  __typename?: 'reviews_aggregate';
  aggregate?: Maybe<Reviews_Aggregate_Fields>;
  nodes: Array<Reviews>;
};

/** aggregate fields of "reviews" */
export type Reviews_Aggregate_Fields = {
  __typename?: 'reviews_aggregate_fields';
  avg?: Maybe<Reviews_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Reviews_Max_Fields>;
  min?: Maybe<Reviews_Min_Fields>;
  stddev?: Maybe<Reviews_Stddev_Fields>;
  stddev_pop?: Maybe<Reviews_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Reviews_Stddev_Samp_Fields>;
  sum?: Maybe<Reviews_Sum_Fields>;
  var_pop?: Maybe<Reviews_Var_Pop_Fields>;
  var_samp?: Maybe<Reviews_Var_Samp_Fields>;
  variance?: Maybe<Reviews_Variance_Fields>;
};


/** aggregate fields of "reviews" */
export type Reviews_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Reviews_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Reviews_Avg_Fields = {
  __typename?: 'reviews_avg_fields';
  rating?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "reviews". All fields are combined with a logical 'AND'. */
export type Reviews_Bool_Exp = {
  _and?: InputMaybe<Array<Reviews_Bool_Exp>>;
  _not?: InputMaybe<Reviews_Bool_Exp>;
  _or?: InputMaybe<Array<Reviews_Bool_Exp>>;
  comment?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Date_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  menu_id?: InputMaybe<Uuid_Comparison_Exp>;
  partner_id?: InputMaybe<Uuid_Comparison_Exp>;
  rating?: InputMaybe<Int_Comparison_Exp>;
  type?: InputMaybe<String_Comparison_Exp>;
  user_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "reviews" */
export enum Reviews_Constraint {
  /** unique or primary key constraint on columns "id" */
  ReviewsPkey = 'reviews_pkey'
}

/** input type for incrementing numeric columns in table "reviews" */
export type Reviews_Inc_Input = {
  rating?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "reviews" */
export type Reviews_Insert_Input = {
  comment?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['date']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  menu_id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  rating?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate max on columns */
export type Reviews_Max_Fields = {
  __typename?: 'reviews_max_fields';
  comment?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['date']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  menu_id?: Maybe<Scalars['uuid']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  rating?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** aggregate min on columns */
export type Reviews_Min_Fields = {
  __typename?: 'reviews_min_fields';
  comment?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['date']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  menu_id?: Maybe<Scalars['uuid']['output']>;
  partner_id?: Maybe<Scalars['uuid']['output']>;
  rating?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  user_id?: Maybe<Scalars['uuid']['output']>;
};

/** response of any mutation on the table "reviews" */
export type Reviews_Mutation_Response = {
  __typename?: 'reviews_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Reviews>;
};

/** on_conflict condition type for table "reviews" */
export type Reviews_On_Conflict = {
  constraint: Reviews_Constraint;
  update_columns?: Array<Reviews_Update_Column>;
  where?: InputMaybe<Reviews_Bool_Exp>;
};

/** Ordering options when selecting data from "reviews". */
export type Reviews_Order_By = {
  comment?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  menu_id?: InputMaybe<Order_By>;
  partner_id?: InputMaybe<Order_By>;
  rating?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: reviews */
export type Reviews_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "reviews" */
export enum Reviews_Select_Column {
  /** column name */
  Comment = 'comment',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  MenuId = 'menu_id',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  Rating = 'rating',
  /** column name */
  Type = 'type',
  /** column name */
  UserId = 'user_id'
}

/** input type for updating data in table "reviews" */
export type Reviews_Set_Input = {
  comment?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['date']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  menu_id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  rating?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate stddev on columns */
export type Reviews_Stddev_Fields = {
  __typename?: 'reviews_stddev_fields';
  rating?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Reviews_Stddev_Pop_Fields = {
  __typename?: 'reviews_stddev_pop_fields';
  rating?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Reviews_Stddev_Samp_Fields = {
  __typename?: 'reviews_stddev_samp_fields';
  rating?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "reviews" */
export type Reviews_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Reviews_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Reviews_Stream_Cursor_Value_Input = {
  comment?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['date']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  menu_id?: InputMaybe<Scalars['uuid']['input']>;
  partner_id?: InputMaybe<Scalars['uuid']['input']>;
  rating?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['uuid']['input']>;
};

/** aggregate sum on columns */
export type Reviews_Sum_Fields = {
  __typename?: 'reviews_sum_fields';
  rating?: Maybe<Scalars['Int']['output']>;
};

/** update columns of table "reviews" */
export enum Reviews_Update_Column {
  /** column name */
  Comment = 'comment',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  MenuId = 'menu_id',
  /** column name */
  PartnerId = 'partner_id',
  /** column name */
  Rating = 'rating',
  /** column name */
  Type = 'type',
  /** column name */
  UserId = 'user_id'
}

export type Reviews_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Reviews_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Reviews_Set_Input>;
  /** filter the rows which have to be updated */
  where: Reviews_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Reviews_Var_Pop_Fields = {
  __typename?: 'reviews_var_pop_fields';
  rating?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Reviews_Var_Samp_Fields = {
  __typename?: 'reviews_var_samp_fields';
  rating?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Reviews_Variance_Fields = {
  __typename?: 'reviews_variance_fields';
  rating?: Maybe<Scalars['Float']['output']>;
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** fetch data from the table: "category" */
  category: Array<Category>;
  /** fetch aggregated fields from the table: "category" */
  category_aggregate: Category_Aggregate;
  /** fetch data from the table: "category" using primary key columns */
  category_by_pk?: Maybe<Category>;
  /** fetch data from the table in a streaming manner: "category" */
  category_stream: Array<Category>;
  /** fetch data from the table: "cravings_items" */
  cravings_items: Array<Cravings_Items>;
  /** fetch aggregated fields from the table: "cravings_items" */
  cravings_items_aggregate: Cravings_Items_Aggregate;
  /** fetch data from the table: "cravings_items" using primary key columns */
  cravings_items_by_pk?: Maybe<Cravings_Items>;
  /** fetch data from the table in a streaming manner: "cravings_items" */
  cravings_items_stream: Array<Cravings_Items>;
  /** fetch data from the table: "followers" */
  followers: Array<Followers>;
  /** fetch aggregated fields from the table: "followers" */
  followers_aggregate: Followers_Aggregate;
  /** fetch data from the table: "followers" using primary key columns */
  followers_by_pk?: Maybe<Followers>;
  /** fetch data from the table in a streaming manner: "followers" */
  followers_stream: Array<Followers>;
  /** fetch data from the table: "menu" */
  menu: Array<Menu>;
  /** fetch aggregated fields from the table: "menu" */
  menu_aggregate: Menu_Aggregate;
  /** fetch data from the table: "menu" using primary key columns */
  menu_by_pk?: Maybe<Menu>;
  /** fetch data from the table in a streaming manner: "menu" */
  menu_stream: Array<Menu>;
  /** fetch data from the table: "offers" */
  offers: Array<Offers>;
  /** fetch aggregated fields from the table: "offers" */
  offers_aggregate: Offers_Aggregate;
  /** fetch data from the table: "offers" using primary key columns */
  offers_by_pk?: Maybe<Offers>;
  /** fetch data from the table: "offers_claimed" */
  offers_claimed: Array<Offers_Claimed>;
  /** fetch aggregated fields from the table: "offers_claimed" */
  offers_claimed_aggregate: Offers_Claimed_Aggregate;
  /** fetch data from the table: "offers_claimed" using primary key columns */
  offers_claimed_by_pk?: Maybe<Offers_Claimed>;
  /** fetch data from the table in a streaming manner: "offers_claimed" */
  offers_claimed_stream: Array<Offers_Claimed>;
  /** fetch data from the table in a streaming manner: "offers" */
  offers_stream: Array<Offers>;
  /** fetch data from the table: "partners" */
  partners: Array<Partners>;
  /** fetch aggregated fields from the table: "partners" */
  partners_aggregate: Partners_Aggregate;
  /** fetch data from the table: "partners" using primary key columns */
  partners_by_pk?: Maybe<Partners>;
  /** fetch data from the table in a streaming manner: "partners" */
  partners_stream: Array<Partners>;
  /** fetch data from the table: "payments" */
  payments: Array<Payments>;
  /** fetch aggregated fields from the table: "payments" */
  payments_aggregate: Payments_Aggregate;
  /** fetch data from the table: "payments" using primary key columns */
  payments_by_pk?: Maybe<Payments>;
  /** fetch data from the table in a streaming manner: "payments" */
  payments_stream: Array<Payments>;
  /** fetch data from the table: "qr_codes" */
  qr_codes: Array<Qr_Codes>;
  /** fetch aggregated fields from the table: "qr_codes" */
  qr_codes_aggregate: Qr_Codes_Aggregate;
  /** fetch data from the table: "qr_codes" using primary key columns */
  qr_codes_by_pk?: Maybe<Qr_Codes>;
  /** fetch data from the table in a streaming manner: "qr_codes" */
  qr_codes_stream: Array<Qr_Codes>;
  /** fetch data from the table: "reviews" */
  reviews: Array<Reviews>;
  /** fetch aggregated fields from the table: "reviews" */
  reviews_aggregate: Reviews_Aggregate;
  /** fetch data from the table: "reviews" using primary key columns */
  reviews_by_pk?: Maybe<Reviews>;
  /** fetch data from the table in a streaming manner: "reviews" */
  reviews_stream: Array<Reviews>;
  /** fetch data from the table: "users" */
  users: Array<Users>;
  /** fetch aggregated fields from the table: "users" */
  users_aggregate: Users_Aggregate;
  /** fetch data from the table: "users" using primary key columns */
  users_by_pk?: Maybe<Users>;
  /** fetch data from the table in a streaming manner: "users" */
  users_stream: Array<Users>;
};


export type Subscription_RootCategoryArgs = {
  distinct_on?: InputMaybe<Array<Category_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Category_Order_By>>;
  where?: InputMaybe<Category_Bool_Exp>;
};


export type Subscription_RootCategory_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Category_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Category_Order_By>>;
  where?: InputMaybe<Category_Bool_Exp>;
};


export type Subscription_RootCategory_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootCategory_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Category_Stream_Cursor_Input>>;
  where?: InputMaybe<Category_Bool_Exp>;
};


export type Subscription_RootCravings_ItemsArgs = {
  distinct_on?: InputMaybe<Array<Cravings_Items_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Cravings_Items_Order_By>>;
  where?: InputMaybe<Cravings_Items_Bool_Exp>;
};


export type Subscription_RootCravings_Items_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Cravings_Items_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Cravings_Items_Order_By>>;
  where?: InputMaybe<Cravings_Items_Bool_Exp>;
};


export type Subscription_RootCravings_Items_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootCravings_Items_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Cravings_Items_Stream_Cursor_Input>>;
  where?: InputMaybe<Cravings_Items_Bool_Exp>;
};


export type Subscription_RootFollowersArgs = {
  distinct_on?: InputMaybe<Array<Followers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Followers_Order_By>>;
  where?: InputMaybe<Followers_Bool_Exp>;
};


export type Subscription_RootFollowers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Followers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Followers_Order_By>>;
  where?: InputMaybe<Followers_Bool_Exp>;
};


export type Subscription_RootFollowers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootFollowers_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Followers_Stream_Cursor_Input>>;
  where?: InputMaybe<Followers_Bool_Exp>;
};


export type Subscription_RootMenuArgs = {
  distinct_on?: InputMaybe<Array<Menu_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Menu_Order_By>>;
  where?: InputMaybe<Menu_Bool_Exp>;
};


export type Subscription_RootMenu_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Menu_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Menu_Order_By>>;
  where?: InputMaybe<Menu_Bool_Exp>;
};


export type Subscription_RootMenu_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootMenu_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Menu_Stream_Cursor_Input>>;
  where?: InputMaybe<Menu_Bool_Exp>;
};


export type Subscription_RootOffersArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Offers_Order_By>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};


export type Subscription_RootOffers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Offers_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Offers_Order_By>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};


export type Subscription_RootOffers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootOffers_ClaimedArgs = {
  distinct_on?: InputMaybe<Array<Offers_Claimed_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Offers_Claimed_Order_By>>;
  where?: InputMaybe<Offers_Claimed_Bool_Exp>;
};


export type Subscription_RootOffers_Claimed_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Offers_Claimed_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Offers_Claimed_Order_By>>;
  where?: InputMaybe<Offers_Claimed_Bool_Exp>;
};


export type Subscription_RootOffers_Claimed_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootOffers_Claimed_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Offers_Claimed_Stream_Cursor_Input>>;
  where?: InputMaybe<Offers_Claimed_Bool_Exp>;
};


export type Subscription_RootOffers_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Offers_Stream_Cursor_Input>>;
  where?: InputMaybe<Offers_Bool_Exp>;
};


export type Subscription_RootPartnersArgs = {
  distinct_on?: InputMaybe<Array<Partners_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Partners_Order_By>>;
  where?: InputMaybe<Partners_Bool_Exp>;
};


export type Subscription_RootPartners_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Partners_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Partners_Order_By>>;
  where?: InputMaybe<Partners_Bool_Exp>;
};


export type Subscription_RootPartners_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootPartners_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Partners_Stream_Cursor_Input>>;
  where?: InputMaybe<Partners_Bool_Exp>;
};


export type Subscription_RootPaymentsArgs = {
  distinct_on?: InputMaybe<Array<Payments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Payments_Order_By>>;
  where?: InputMaybe<Payments_Bool_Exp>;
};


export type Subscription_RootPayments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Payments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Payments_Order_By>>;
  where?: InputMaybe<Payments_Bool_Exp>;
};


export type Subscription_RootPayments_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootPayments_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Payments_Stream_Cursor_Input>>;
  where?: InputMaybe<Payments_Bool_Exp>;
};


export type Subscription_RootQr_CodesArgs = {
  distinct_on?: InputMaybe<Array<Qr_Codes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Qr_Codes_Order_By>>;
  where?: InputMaybe<Qr_Codes_Bool_Exp>;
};


export type Subscription_RootQr_Codes_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Qr_Codes_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Qr_Codes_Order_By>>;
  where?: InputMaybe<Qr_Codes_Bool_Exp>;
};


export type Subscription_RootQr_Codes_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootQr_Codes_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Qr_Codes_Stream_Cursor_Input>>;
  where?: InputMaybe<Qr_Codes_Bool_Exp>;
};


export type Subscription_RootReviewsArgs = {
  distinct_on?: InputMaybe<Array<Reviews_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Reviews_Order_By>>;
  where?: InputMaybe<Reviews_Bool_Exp>;
};


export type Subscription_RootReviews_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Reviews_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Reviews_Order_By>>;
  where?: InputMaybe<Reviews_Bool_Exp>;
};


export type Subscription_RootReviews_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootReviews_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Reviews_Stream_Cursor_Input>>;
  where?: InputMaybe<Reviews_Bool_Exp>;
};


export type Subscription_RootUsersArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};


export type Subscription_RootUsers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Users_Order_By>>;
  where?: InputMaybe<Users_Bool_Exp>;
};


export type Subscription_RootUsers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootUsers_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Users_Stream_Cursor_Input>>;
  where?: InputMaybe<Users_Bool_Exp>;
};

/** columns and relationships of "users" */
export type Users = {
  __typename?: 'users';
  crave_coins: Scalars['Int']['output'];
  email: Scalars['String']['output'];
  full_name: Scalars['String']['output'];
  id: Scalars['uuid']['output'];
  location?: Maybe<Scalars['String']['output']>;
  password?: Maybe<Scalars['String']['output']>;
  phone: Scalars['String']['output'];
};

/** aggregated selection of "users" */
export type Users_Aggregate = {
  __typename?: 'users_aggregate';
  aggregate?: Maybe<Users_Aggregate_Fields>;
  nodes: Array<Users>;
};

/** aggregate fields of "users" */
export type Users_Aggregate_Fields = {
  __typename?: 'users_aggregate_fields';
  avg?: Maybe<Users_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Users_Max_Fields>;
  min?: Maybe<Users_Min_Fields>;
  stddev?: Maybe<Users_Stddev_Fields>;
  stddev_pop?: Maybe<Users_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Users_Stddev_Samp_Fields>;
  sum?: Maybe<Users_Sum_Fields>;
  var_pop?: Maybe<Users_Var_Pop_Fields>;
  var_samp?: Maybe<Users_Var_Samp_Fields>;
  variance?: Maybe<Users_Variance_Fields>;
};


/** aggregate fields of "users" */
export type Users_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Users_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Users_Avg_Fields = {
  __typename?: 'users_avg_fields';
  crave_coins?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "users". All fields are combined with a logical 'AND'. */
export type Users_Bool_Exp = {
  _and?: InputMaybe<Array<Users_Bool_Exp>>;
  _not?: InputMaybe<Users_Bool_Exp>;
  _or?: InputMaybe<Array<Users_Bool_Exp>>;
  crave_coins?: InputMaybe<Int_Comparison_Exp>;
  email?: InputMaybe<String_Comparison_Exp>;
  full_name?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  location?: InputMaybe<String_Comparison_Exp>;
  password?: InputMaybe<String_Comparison_Exp>;
  phone?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "users" */
export enum Users_Constraint {
  /** unique or primary key constraint on columns "id" */
  UsersPkey = 'users_pkey'
}

/** input type for incrementing numeric columns in table "users" */
export type Users_Inc_Input = {
  crave_coins?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "users" */
export type Users_Insert_Input = {
  crave_coins?: InputMaybe<Scalars['Int']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  full_name?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate max on columns */
export type Users_Max_Fields = {
  __typename?: 'users_max_fields';
  crave_coins?: Maybe<Scalars['Int']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  full_name?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  password?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Users_Min_Fields = {
  __typename?: 'users_min_fields';
  crave_coins?: Maybe<Scalars['Int']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  full_name?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['uuid']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  password?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
};

/** response of any mutation on the table "users" */
export type Users_Mutation_Response = {
  __typename?: 'users_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']['output'];
  /** data from the rows affected by the mutation */
  returning: Array<Users>;
};

/** on_conflict condition type for table "users" */
export type Users_On_Conflict = {
  constraint: Users_Constraint;
  update_columns?: Array<Users_Update_Column>;
  where?: InputMaybe<Users_Bool_Exp>;
};

/** Ordering options when selecting data from "users". */
export type Users_Order_By = {
  crave_coins?: InputMaybe<Order_By>;
  email?: InputMaybe<Order_By>;
  full_name?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  location?: InputMaybe<Order_By>;
  password?: InputMaybe<Order_By>;
  phone?: InputMaybe<Order_By>;
};

/** primary key columns input for table: users */
export type Users_Pk_Columns_Input = {
  id: Scalars['uuid']['input'];
};

/** select columns of table "users" */
export enum Users_Select_Column {
  /** column name */
  CraveCoins = 'crave_coins',
  /** column name */
  Email = 'email',
  /** column name */
  FullName = 'full_name',
  /** column name */
  Id = 'id',
  /** column name */
  Location = 'location',
  /** column name */
  Password = 'password',
  /** column name */
  Phone = 'phone'
}

/** input type for updating data in table "users" */
export type Users_Set_Input = {
  crave_coins?: InputMaybe<Scalars['Int']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  full_name?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate stddev on columns */
export type Users_Stddev_Fields = {
  __typename?: 'users_stddev_fields';
  crave_coins?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Users_Stddev_Pop_Fields = {
  __typename?: 'users_stddev_pop_fields';
  crave_coins?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Users_Stddev_Samp_Fields = {
  __typename?: 'users_stddev_samp_fields';
  crave_coins?: Maybe<Scalars['Float']['output']>;
};

/** Streaming cursor of the table "users" */
export type Users_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Users_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Users_Stream_Cursor_Value_Input = {
  crave_coins?: InputMaybe<Scalars['Int']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  full_name?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

/** aggregate sum on columns */
export type Users_Sum_Fields = {
  __typename?: 'users_sum_fields';
  crave_coins?: Maybe<Scalars['Int']['output']>;
};

/** update columns of table "users" */
export enum Users_Update_Column {
  /** column name */
  CraveCoins = 'crave_coins',
  /** column name */
  Email = 'email',
  /** column name */
  FullName = 'full_name',
  /** column name */
  Id = 'id',
  /** column name */
  Location = 'location',
  /** column name */
  Password = 'password',
  /** column name */
  Phone = 'phone'
}

export type Users_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Users_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Users_Set_Input>;
  /** filter the rows which have to be updated */
  where: Users_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Users_Var_Pop_Fields = {
  __typename?: 'users_var_pop_fields';
  crave_coins?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Users_Var_Samp_Fields = {
  __typename?: 'users_var_samp_fields';
  crave_coins?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Users_Variance_Fields = {
  __typename?: 'users_variance_fields';
  crave_coins?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['uuid']['input']>;
  _gt?: InputMaybe<Scalars['uuid']['input']>;
  _gte?: InputMaybe<Scalars['uuid']['input']>;
  _in?: InputMaybe<Array<Scalars['uuid']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['uuid']['input']>;
  _lte?: InputMaybe<Scalars['uuid']['input']>;
  _neq?: InputMaybe<Scalars['uuid']['input']>;
  _nin?: InputMaybe<Array<Scalars['uuid']['input']>>;
};

export type GetUserByEmailQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type GetUserByEmailQuery = { __typename?: 'query_root', users: Array<{ __typename?: 'users', id: any }> };

export type InsertUserMutationVariables = Exact<{
  object: Users_Insert_Input;
}>;


export type InsertUserMutation = { __typename?: 'mutation_root', insert_users_one?: { __typename?: 'users', id: any, email: string } | null };



export const GetUserByEmailDocument = `
    query GetUserByEmail($email: String!) {
  users(where: {email: {_eq: $email}}, limit: 1) {
    id
  }
}
    `;

export const useGetUserByEmailQuery = <
      TData = GetUserByEmailQuery,
      TError = unknown
    >(
      dataSource: { endpoint: string, fetchParams?: RequestInit },
      variables: GetUserByEmailQueryVariables,
      options?: UseQueryOptions<GetUserByEmailQuery, TError, TData>
    ) => {
    
    return useQuery<GetUserByEmailQuery, TError, TData>(
      ['GetUserByEmail', variables],
      fetcher<GetUserByEmailQuery, GetUserByEmailQueryVariables>(dataSource.endpoint, dataSource.fetchParams || {}, GetUserByEmailDocument, variables),
      options
    )};

export const InsertUserDocument = `
    mutation InsertUser($object: users_insert_input!) {
  insert_users_one(object: $object) {
    id
    email
  }
}
    `;

export const useInsertUserMutation = <
      TError = unknown,
      TContext = unknown
    >(
      dataSource: { endpoint: string, fetchParams?: RequestInit },
      options?: UseMutationOptions<InsertUserMutation, TError, InsertUserMutationVariables, TContext>
    ) => {
    
    return useMutation<InsertUserMutation, TError, InsertUserMutationVariables, TContext>(
      ['InsertUser'],
      (variables?: InsertUserMutationVariables) => fetcher<InsertUserMutation, InsertUserMutationVariables>(dataSource.endpoint, dataSource.fetchParams || {}, InsertUserDocument, variables)(),
      options
    )};
